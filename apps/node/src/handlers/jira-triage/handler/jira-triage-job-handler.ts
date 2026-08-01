// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { SkillRegistry, SkillSelector, type AgentDefinition } from '@cortex/agent-runtime'
import {
  JiraTriageJobKind,
  JiraTriageJobPayloadSchema,
  type JiraTriageEscalation,
  type JiraTriageFix,
  type JiraTriageJobResult,
  type JiraTriageRepro,
} from '@cortex/protocol'
import { AgentProcessResolver } from '../../../agent/agent-process-resolver'
import {
  ConfigJiraConnectionStore,
  ConfigSourceControlConnectionStore,
  type SourceControlConnection,
} from '../../../connection'
import { NODE_CONFIGURATION, type NodeConfiguration } from '../../../configuration'
import type { ExecutionJobHandler, ExecutionJobHandlerContext } from '../../../execution/handler'
import { EXECUTION_ENGINE, type ExecutionEngine } from '../../../execution-engine'
import { GitHubClient, GitHubPullResource } from '../../../github'
import { JiraClient, JiraCommentResource, JiraIssueResource, type JiraIssue } from '../../../jira'
import { GitWorkspaceManager } from '../../../workspace'
import { extractJsonObject, mapJiraTriageClassification } from '../mapper/jira-triage-classification-mapper'
import {
  buildJiraClassifyUserContext,
  buildJiraFixPrompt,
  composeJiraClassifyPrompt,
} from '../composer/jira-triage-prompt-composer'
import type { ResolvedJiraRepository } from '../models'
import { resolveJiraRepository } from '../resolver/jira-repo-resolver'
import { TestRunner } from '../runner/test-runner'

/**
 * Executes claimed jobs with kind {@link JiraTriageJobKind}.
 *
 * Flow: read issue → classify → gate assignee → resolve repo → run/dry-run
 * tests → optional coder fix + draft PR → escalate in Jira when needed.
 */
@Injectable()
export class JiraTriageJobHandler implements ExecutionJobHandler<JiraTriageJobResult> {
  readonly kind = JiraTriageJobKind

  private readonly skillSelector = new SkillSelector()

  // MARK: - Constructor

  /**
   * Creates a `jira.triage` job handler.
   *
   * @param agentProcessResolver - Resolves the QA/coder agents for triage steps.
   * @param configuration - Node configuration for triage runtime gates.
   * @param executionEngine - Engine used for classify and fix agent runs.
   * @param jiraConnectionStore - Store resolving Jira connection credentials.
   * @param skillRegistry - Registry of skills available for selective injection.
   * @param sourceControlConnectionStore - Store resolving source-control credentials.
   * @param testRunner - Runs or dry-runs reproduction tests in the workspace.
   * @param workspaceManager - Prepares git workspaces for triage runs.
   */
  constructor(
    private readonly agentProcessResolver: AgentProcessResolver,
    @Inject(NODE_CONFIGURATION)
    private readonly configuration: NodeConfiguration,
    @Inject(EXECUTION_ENGINE)
    private readonly executionEngine: ExecutionEngine,
    private readonly jiraConnectionStore: ConfigJiraConnectionStore,
    private readonly skillRegistry: SkillRegistry,
    private readonly sourceControlConnectionStore: ConfigSourceControlConnectionStore,
    private readonly testRunner: TestRunner,
    private readonly workspaceManager: GitWorkspaceManager,
  ) {}

  async process(payload: unknown, context: ExecutionJobHandlerContext): Promise<JiraTriageJobResult> {
    context.signal.throwIfAborted()

    const jobPayload = JiraTriageJobPayloadSchema.parse(payload)
    const jiraConnection = this.jiraConnectionStore.resolve(jobPayload.connectionId)
    const jiraClient = new JiraClient(jiraConnection)
    const jiraComments = new JiraCommentResource(jiraClient)
    const jiraIssues = new JiraIssueResource(jiraClient)
    const issue = await jiraIssues.get(jobPayload.issueKey, context.signal)

    const qaAgent = this.agentProcessResolver.resolveAgent(JiraTriageJobKind)
    const classifyUserContext = buildJiraClassifyUserContext(issue)
    const skillPrompts = this.resolveSkillPrompts(qaAgent, classifyUserContext)
    const classifyPrompt = composeJiraClassifyPrompt({
      skillPrompts,
      systemPrompt: qaAgent.descriptor.systemPrompt,
      userContext: classifyUserContext,
    })

    const classifyOutput = await this.executionEngine.run({
      agentId: qaAgent.id,
      cwd: process.cwd(),
      prompt: classifyPrompt,
      signal: context.signal,
    })

    const classification = mapJiraTriageClassification(classifyOutput.output)

    if (!this.passesAssigneeGate(issue, jobPayload.assigneeFilter)) {
      const escalation = await this.escalate({
        comment: this.formatEscalationComment({
          classification,
          issueKey: issue.key,
          reason: 'Issue is not assigned to the configured automation user.',
        }),
        comments: jiraComments,
        issues: jiraIssues,
        escalateAccountId: undefined,
        issueKey: issue.key,
        reason: 'Assignee gate failed.',
        reassign: false,
        signal: context.signal,
      })

      return {
        classification,
        escalation,
        issueKey: issue.key,
      }
    }

    if (!classification.automationEligible || classification.class !== 'bug') {
      const escalation = await this.escalate({
        comment: this.formatEscalationComment({
          classification,
          issueKey: issue.key,
          reason: 'Ticket is not an automation-eligible bug.',
        }),
        comments: jiraComments,
        issues: jiraIssues,
        escalateAccountId: this.lookupEscalateAccountId(issue.projectKey),
        issueKey: issue.key,
        reason: 'Not automation-eligible.',
        reassign: true,
        signal: context.signal,
      })

      return {
        classification,
        escalation,
        issueKey: issue.key,
      }
    }

    const resolution = resolveJiraRepository({
      customFieldId: this.configuration.jiraRepoCustomFieldId,
      issue,
      payloadRepository: jobPayload.repository,
      projectRepos: this.configuration.jiraProjectRepos,
    })

    if (resolution.kind === 'missing' || resolution.kind === 'ambiguous') {
      const reason =
        resolution.kind === 'missing'
          ? 'No GitHub repository mapping for this ticket.'
          : `Ambiguous GitHub repositories: ${resolution.repositories.join(', ')}`

      const escalation = await this.escalate({
        comment: this.formatEscalationComment({
          classification,
          issueKey: issue.key,
          reason,
        }),
        comments: jiraComments,
        issues: jiraIssues,
        escalateAccountId: this.lookupEscalateAccountId(issue.projectKey),
        issueKey: issue.key,
        reason,
        reassign: true,
        signal: context.signal,
      })

      return {
        classification,
        escalation,
        issueKey: issue.key,
        repro: {
          status: resolution.kind === 'missing' ? 'missing_repo' : 'ambiguous_repo',
          summary: reason,
          suites: [],
        },
      }
    }

    const repository = resolution.repository
    const suites = {
      ...(repository.unitTestCommand ? { unit: repository.unitTestCommand } : {}),
      ...(repository.uiTestCommand ? { ui: repository.uiTestCommand } : {}),
    }

    if (Object.keys(suites).length === 0) {
      const reason = 'Repository mapping has no allowlisted unit/UI test commands.'
      const escalation = await this.escalate({
        comment: this.formatEscalationComment({
          classification,
          issueKey: issue.key,
          reason,
        }),
        comments: jiraComments,
        issues: jiraIssues,
        escalateAccountId: repository.escalateAccountId,
        issueKey: issue.key,
        reason,
        reassign: true,
        signal: context.signal,
      })

      return {
        classification,
        escalation,
        issueKey: issue.key,
        repository: this.toResultRepository(repository),
        repro: {
          status: 'skipped',
          summary: reason,
          suites: [],
        },
      }
    }

    if (jobPayload.options.dryRunTests) {
      const dryRunSuites = this.testRunner.dryRun(suites)
      const comment = this.formatEscalationComment({
        classification,
        issueKey: issue.key,
        reason: `Dry-run: would execute ${dryRunSuites.map((suite) => suite.command).join(' | ')}`,
        repository,
      })

      await jiraComments.create(issue.key, comment, context.signal)

      return {
        classification,
        escalation: {
          action: 'comment',
          reason: 'Dry-run completed; no escalation reassignment.',
        },
        issueKey: issue.key,
        repository: this.toResultRepository(repository),
        repro: {
          status: 'dry_run',
          summary: 'Test commands reported without execution.',
          suites: dryRunSuites,
        },
      }
    }

    const sourceControlConnection = this.resolveSourceControlConnection(
      jobPayload.sourceControlConnectionId ?? repository.sourceControlConnectionId,
    )

    const workspace = await this.workspaceManager.prepare({
      accessToken: sourceControlConnection.token,
      cloneUrl: repository.cloneUrl,
      headRef: repository.defaultBranch,
      signal: context.signal,
    })

    try {
      const suiteResults = await this.testRunner.run({
        signal: context.signal,
        suites,
        workingDirectory: workspace.path,
      })

      const failing = suiteResults.filter((suite) => (suite.exitCode ?? 0) !== 0)
      const reproduced = failing.length > 0

      const repro: JiraTriageRepro = {
        status: reproduced ? 'reproduced' : 'not_reproduced',
        summary: reproduced
          ? `Failing suites: ${failing.map((suite) => suite.suiteId).join(', ')}`
          : 'Configured tests passed; issue not reproduced.',
        suites: suiteResults,
      }

      let fix: JiraTriageFix | undefined

      if (reproduced && jobPayload.options.attemptFix) {
        fix = await this.attemptFix({
          failingSummary: failing.map((suite) => suite.summary ?? suite.command).join('\n\n'),
          issue,
          repository,
          signal: context.signal,
          sourceControlConnection,
          suites,
          workspacePath: workspace.path,
        })
      }

      if (fix?.succeeded && fix.pullRequestUrl) {
        const comment = [
          `Cortex QA reproduced \`${issue.key}\` and opened a draft PR.`,
          '',
          `- Classification: ${classification.class} (${classification.confidence})`,
          `- PR: ${fix.pullRequestUrl}`,
          `- Fix: ${fix.summary ?? 'see PR'}`,
        ].join('\n')

        await jiraComments.create(issue.key, comment, context.signal)

        return {
          classification,
          escalation: {
            action: 'comment',
            reason: 'Fix succeeded; draft PR linked on the ticket.',
          },
          fix,
          issueKey: issue.key,
          repository: this.toResultRepository(repository),
          repro,
        }
      }

      const reason = reproduced
        ? fix?.attempted
          ? 'Bug reproduced but fix did not leave tests green.'
          : 'Bug reproduced; autofix disabled.'
        : 'Could not reproduce the reported bug with mapped tests.'

      const escalation = await this.escalate({
        comment: this.formatEscalationComment({
          classification,
          fix,
          issueKey: issue.key,
          reason,
          repository,
          repro,
        }),
        comments: jiraComments,
        issues: jiraIssues,
        escalateAccountId: repository.escalateAccountId,
        issueKey: issue.key,
        reason,
        reassign: true,
        signal: context.signal,
      })

      return {
        classification,
        escalation,
        fix,
        issueKey: issue.key,
        repository: this.toResultRepository(repository),
        repro,
      }
    } finally {
      await this.workspaceManager.cleanup(workspace)
    }
  }

  private async attemptFix(input: {
    readonly failingSummary: string
    readonly issue: JiraIssue
    readonly repository: ResolvedJiraRepository
    readonly signal: AbortSignal
    readonly sourceControlConnection: SourceControlConnection
    readonly suites: Readonly<Partial<Record<'unit' | 'ui', string>>>
    readonly workspacePath: string
  }): Promise<JiraTriageFix> {
    const coderAgent = this.agentProcessResolver.resolveAgent('repository.review')
    const fixContext = [input.issue.key, input.issue.summary, input.failingSummary, 'fix', 'pull request'].join(' ')
    const skillPrompts = this.resolveSkillPrompts(coderAgent, fixContext)
    const branchName = `cortex/jira-${input.issue.key.toLowerCase()}-${Date.now()}`

    const workspace = { path: input.workspacePath }
    await this.workspaceManager.createBranch(workspace, branchName, input.signal)

    const prompt = buildJiraFixPrompt({
      failingSummary: input.failingSummary,
      issue: input.issue,
      skillPrompts,
      systemPrompt: coderAgent.descriptor.systemPrompt,
    })

    const engineResult = await this.executionEngine.run({
      agentId: coderAgent.id,
      cwd: input.workspacePath,
      prompt,
      signal: input.signal,
    })

    let fixSummary = 'Agent fix attempt completed.'
    try {
      const parsed = extractJsonObject(engineResult.output) as {
        summary?: string
      }
      if (typeof parsed.summary === 'string' && parsed.summary.trim()) {
        fixSummary = parsed.summary.trim()
      }
    } catch {
      // Keep default summary when the engine does not return JSON.
    }

    const committed = await this.workspaceManager.commitAll(
      workspace,
      `fix(${input.issue.key}): ${fixSummary}`,
      input.signal,
    )

    if (!committed) {
      return {
        attempted: true,
        branchName,
        succeeded: false,
        summary: 'Agent produced no commit.',
      }
    }

    const retest = await this.testRunner.run({
      signal: input.signal,
      suites: input.suites,
      workingDirectory: input.workspacePath,
    })

    const stillFailing = retest.some((suite) => (suite.exitCode ?? 0) !== 0)
    if (stillFailing) {
      return {
        attempted: true,
        branchName,
        succeeded: false,
        summary: fixSummary,
      }
    }

    await this.workspaceManager.pushBranch({
      accessToken: input.sourceControlConnection.token,
      branchName,
      cloneUrl: input.repository.cloneUrl,
      signal: input.signal,
      workspace,
    })

    const pulls = new GitHubPullResource(new GitHubClient(input.sourceControlConnection))
    const pullRequestUrl = await pulls.createDraft(
      input.repository.owner,
      input.repository.name,
      {
        base: input.repository.defaultBranch,
        body: [`Automated fix attempt for ${input.issue.key}.`, '', input.issue.summary, '', fixSummary].join('\n'),
        head: branchName,
        title: `fix(${input.issue.key}): ${input.issue.summary}`.slice(0, 120),
      },
      input.signal,
    )

    return {
      attempted: true,
      branchName,
      pullRequestUrl,
      succeeded: true,
      summary: fixSummary,
    }
  }

  private passesAssigneeGate(issue: JiraIssue, filter: { accountId?: string; email?: string } | undefined): boolean {
    const expectedAccountId = filter?.accountId ?? this.configuration.jiraAutomationAssigneeAccountId

    if (!expectedAccountId && !filter?.email) {
      return true
    }

    if (!issue.assignee) {
      return false
    }

    if (expectedAccountId && issue.assignee.accountId !== expectedAccountId) {
      return false
    }

    if (filter?.email) {
      const email = issue.assignee.emailAddress?.toLowerCase()
      if (!email || email !== filter.email.toLowerCase()) {
        return false
      }
    }

    return true
  }

  private resolveSourceControlConnection(connectionId: string | undefined): SourceControlConnection {
    if (connectionId) {
      return this.sourceControlConnectionStore.resolve(connectionId)
    }

    const first = this.configuration.sourceControlConnections[0]
    if (!first) {
      throw new Error('No GitHub source-control connection is configured for jira.triage clone/PR work.')
    }

    return first
  }

  private lookupEscalateAccountId(projectKey: string): string | undefined {
    return this.configuration.jiraProjectRepos.find(
      (entry) => entry.projectKey.toUpperCase() === projectKey.toUpperCase(),
    )?.escalateAccountId
  }

  private async escalate(input: {
    readonly comment: string
    readonly comments: JiraCommentResource
    readonly escalateAccountId: string | undefined
    readonly issueKey: string
    readonly issues: JiraIssueResource
    readonly reason: string
    readonly reassign: boolean
    readonly signal: AbortSignal
  }): Promise<JiraTriageEscalation> {
    await input.comments.create(input.issueKey, input.comment, input.signal)

    if (input.reassign && input.escalateAccountId) {
      await input.issues.assign(input.issueKey, input.escalateAccountId, input.signal)

      return {
        action: 'reassign',
        assigneeAccountId: input.escalateAccountId,
        reason: input.reason,
      }
    }

    return {
      action: 'comment',
      reason: input.reason,
    }
  }

  private formatEscalationComment(input: {
    readonly classification: JiraTriageJobResult['classification']
    readonly fix?: JiraTriageFix
    readonly issueKey: string
    readonly reason: string
    readonly repository?: ResolvedJiraRepository
    readonly repro?: JiraTriageRepro
  }): string {
    const lines = [
      `Cortex QA triage for \`${input.issueKey}\``,
      '',
      `- Classification: ${input.classification.class} (confidence ${input.classification.confidence})`,
      `- Automation eligible: ${input.classification.automationEligible}`,
      `- Rationale: ${input.classification.rationale}`,
      `- Outcome: ${input.reason}`,
    ]

    if (input.repository) {
      lines.push(`- Repository: ${input.repository.owner}/${input.repository.name} (${input.repository.source})`)
    }

    if (input.repro) {
      lines.push(`- Repro: ${input.repro.status} — ${input.repro.summary}`)
      for (const suite of input.repro.suites) {
        lines.push(
          `  - ${suite.suiteId}: \`${suite.command}\`${suite.exitCode === undefined ? '' : ` (exit ${suite.exitCode})`}`,
        )
      }
    }

    if (input.fix) {
      lines.push(`- Fix attempted: ${input.fix.attempted}, succeeded: ${input.fix.succeeded}`)
      if (input.fix.pullRequestUrl) {
        lines.push(`- Draft PR: ${input.fix.pullRequestUrl}`)
      }
    }

    return lines.join('\n')
  }

  private toResultRepository(repository: ResolvedJiraRepository): NonNullable<JiraTriageJobResult['repository']> {
    return {
      cloneUrl: repository.cloneUrl,
      defaultBranch: repository.defaultBranch,
      name: repository.name,
      owner: repository.owner,
      source: repository.source,
    }
  }

  private resolveSkillPrompts(agent: AgentDefinition, context: string): readonly string[] {
    if (!agent.safety.allowSkillUse) {
      return []
    }

    const authorized = agent.descriptor.skills.map((skillId) => {
      return this.skillRegistry.resolve(skillId)
    })

    return this.skillSelector.select({ context, skills: authorized }).map((skill) => skill.prompt)
  }
}
