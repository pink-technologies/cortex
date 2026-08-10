// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import {
  JiraTriageJobKind,
  JiraTriageJobPayloadSchema,
  type JiraTriageClassification,
  type JiraTriageEscalation,
  type JiraTriageFix,
  type JiraTriageJobResult,
  type JiraTriageRepro,
  type JiraTriageTestSuiteResult,
} from '@cortex/protocol'
import {
  ConfigJiraConnectionStore,
  ConfigSourceControlConnectionStore,
  type CommandConfiguration,
  type JiraProjectRepoLead,
  type SourceControlConnection,
} from '../../../connection'
import { NODE_CONFIGURATION, type NodeConfiguration } from '../../../configuration'
import type { ExecutionJobHandler, ExecutionJobHandlerContext } from '../../../execution/handler'
import {
  JiraClient,
  JiraCommentResource,
  JiraIssueResource,
  JiraUserResource,
  type JiraCommentMention,
  type JiraIssue,
} from '@cortex/integrations/jira'
import { GitWorkspaceManager } from '../../../workspace'
import { JiraTriageClassifier } from '../classifier/jira-triage-classifier'
import {
  JiraTriageEscalator,
  type JiraTriageFinishOutcome,
} from '../escalator/jira-triage-escalator'
import { JiraTriageReproductionError } from '../error/error'
import { JiraTriageFixAttempter } from '../fix/jira-triage-fix-attempter'
import type { ResolvedJiraRepository } from '../models'
import { JiraTriageReproAttempter } from '../repro/jira-triage-repro-attempter'
import { resolveJiraRepository } from '../resolver/jira-repo-resolver'
import { resolveAllowlistedSuites } from '../resolver/resolve-allowlisted-suites'
import {
  hasUnrunnableSuiteFailure,
  isUnrunnableSuiteFailure,
} from '../runner/is-unrunnable-suite-failure'
import { TestRunner } from '../runner/test-runner'

/**
 * Executes claimed jobs with kind {@link JiraTriageJobKind}.
 *
 * Flow: start comment → classify → gate assignee → for bugs resolve repo →
 * clone → run allowlisted suites → suite_broken / fill-tests / fix → finish
 * comment (with project-lead @-mention when escalating).
 */
@Injectable()
export class JiraTriageJobHandler implements ExecutionJobHandler<JiraTriageJobResult> {
  readonly kind = JiraTriageJobKind

  // MARK: - Constructor

  /**
   * Creates a `jira.triage` job handler.
   *
   * @param classifier - Runs the QA classify step.
   * @param configuration - Node configuration for triage runtime gates.
   * @param escalator - Posts Jira start/finish comments and reassignments.
   * @param fixAttempter - Runs coder autofix after a successful repro.
   * @param jiraConnectionStore - Store resolving Jira connection credentials.
   * @param reproAttempter - Authors regression tests when suites are initially green.
   * @param sourceControlConnectionStore - Store resolving source-control credentials.
   * @param testRunner - Runs or dry-runs reproduction tests in the workspace.
   * @param workspaceManager - Prepares git workspaces for triage runs.
   */
  constructor(
    private readonly classifier: JiraTriageClassifier,
    @Inject(NODE_CONFIGURATION)
    private readonly configuration: NodeConfiguration,
    private readonly escalator: JiraTriageEscalator,
    private readonly fixAttempter: JiraTriageFixAttempter,
    private readonly jiraConnectionStore: ConfigJiraConnectionStore,
    private readonly reproAttempter: JiraTriageReproAttempter,
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
    const jiraUsers = new JiraUserResource(jiraClient)
    const issue = await jiraIssues.get(jobPayload.issueKey, context.signal)

    await jiraComments.create(issue.key, this.escalator.formatStartComment(), context.signal)

    const classification = await this.classifier.classify(issue, context.signal)
    const projectLead = this.lookupProjectLead(issue.projectKey)

    if (!this.passesAssigneeGate(issue, jobPayload.assigneeFilter)) {
      const escalation = await this.finish({
        comments: jiraComments,
        escalateAccountIdFallback: undefined,
        issues: jiraIssues,
        issueKey: issue.key,
        outcome: 'wrong_assignee',
        projectLead: undefined,
        reason: 'Assignee gate failed.',
        reassign: false,
        signal: context.signal,
        users: jiraUsers,
      })

      return {
        classification,
        escalation,
        issueKey: issue.key,
      }
    }

    if (classification.class !== 'bug') {
      const nonBugClassification: JiraTriageClassification = {
        ...classification,
        automationEligible: false,
      }

      const escalation = await this.finish({
        comments: jiraComments,
        escalateAccountIdFallback: undefined,
        issues: jiraIssues,
        issueKey: issue.key,
        outcome: 'not_bug',
        projectLead: undefined,
        reason: 'Not a bug.',
        reassign: false,
        signal: context.signal,
        users: jiraUsers,
      })

      return {
        classification: nonBugClassification,
        escalation,
        issueKey: issue.key,
      }
    }

    if (jobPayload.options.classifyOnly) {
      await jiraComments.create(
        issue.key,
        this.escalator.formatFinishComment({ outcome: 'classify_only' }),
        context.signal,
      )

      return {
        classification,
        escalation: {
          action: 'comment',
          reason: 'classifyOnly: stopped before repository resolution and reproduction.',
        },
        issueKey: issue.key,
      }
    }

    const bugClassification: JiraTriageClassification = {
      ...classification,
      automationEligible: true,
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

      const escalation = await this.finish({
        comments: jiraComments,
        escalateAccountIdFallback: this.lookupEscalateAccountId(issue.projectKey),
        issues: jiraIssues,
        issueKey: issue.key,
        outcome: resolution.kind === 'missing' ? 'missing_repo' : 'ambiguous_repo',
        projectLead,
        reason,
        reassign: true,
        signal: context.signal,
        users: jiraUsers,
      })

      return {
        classification: bugClassification,
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
    const suites = resolveAllowlistedSuites(repository, {
      issueText: [issue.summary, issue.descriptionText, ...issue.labels].join('\n'),
      selectedAreas: bugClassification.areas,
    })

    if (Object.keys(suites).length === 0) {
      const reason = 'Repository mapping has no allowlisted test suites.'
      const escalation = await this.finish({
        comments: jiraComments,
        escalateAccountIdFallback: repository.escalateAccountId,
        issues: jiraIssues,
        issueKey: issue.key,
        outcome: 'no_suites',
        projectLead: repository.projectLead ?? projectLead,
        reason,
        reassign: true,
        signal: context.signal,
        users: jiraUsers,
      })

      return {
        classification: bugClassification,
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
      await jiraComments.create(
        issue.key,
        this.escalator.formatFinishComment({ outcome: 'dry_run' }),
        context.signal,
      )

      return {
        classification: bugClassification,
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
      issue.key,
    )

    let workspace
    try {
      workspace = await this.workspaceManager.prepare({
        accessToken: sourceControlConnection.token,
        cloneUrl: repository.cloneUrl,
        headRef: repository.defaultBranch,
        signal: context.signal,
      })
    } catch (error) {
      if (context.signal.aborted) {
        throw error
      }

      throw new JiraTriageReproductionError(
        issue.key,
        `Failed to prepare a workspace for Jira issue '${issue.key}'.`,
        { cause: error },
      )
    }

    try {
      let suiteResults = await this.runSuites(issue.key, suites, workspace.path, context.signal)
      let failing = this.failingSuites(suiteResults)

      if (hasUnrunnableSuiteFailure(failing)) {
        return this.finishSuiteBroken({
          classification: bugClassification,
          comments: jiraComments,
          issues: jiraIssues,
          issueKey: issue.key,
          projectLead: repository.projectLead ?? projectLead,
          repository,
          signal: context.signal,
          suiteResults,
          summaryPrefix: 'Suite(s) could not run (build or environment)',
          users: jiraUsers,
          reason:
            'Allowlisted suite(s) failed before tests could run (build or environment). Autofix skipped.',
        })
      }

      let reproduced = failing.length > 0
      let testAuthoringSummary: string | undefined

      if (!reproduced) {
        const authoring = await this.reproAttempter.attempt({
          issue,
          signal: context.signal,
          suites,
          workspace,
        })
        testAuthoringSummary = authoring.committed
          ? `Test authoring committed on ${authoring.branchName}: ${authoring.summary}`
          : `Test authoring attempted on ${authoring.branchName}: ${authoring.summary}`

        suiteResults = await this.runSuites(issue.key, suites, workspace.path, context.signal)
        failing = this.failingSuites(suiteResults)
        reproduced = failing.length > 0

        if (hasUnrunnableSuiteFailure(failing)) {
          return this.finishSuiteBroken({
            classification: bugClassification,
            comments: jiraComments,
            issues: jiraIssues,
            issueKey: issue.key,
            projectLead: repository.projectLead ?? projectLead,
            repository,
            signal: context.signal,
            suiteResults,
            summaryDetail: testAuthoringSummary,
            summaryPrefix:
              'Suite(s) could not run after test authoring (build or environment)',
            users: jiraUsers,
            reason:
              'Allowlisted suite(s) failed before tests could run after test authoring. Autofix skipped.',
          })
        }
      }

      const repro: JiraTriageRepro = {
        status: reproduced ? 'reproduced' : 'not_reproduced',
        summary: reproduced
          ? [
              `Failing suites: ${failing.map((suite) => suite.suiteId).join(', ')}`,
              testAuthoringSummary,
            ]
              .filter((part): part is string => part !== undefined)
              .join(' — ')
          : [
              'Configured tests passed; issue not reproduced.',
              testAuthoringSummary,
            ]
              .filter((part): part is string => part !== undefined)
              .join(' — '),
        suites: suiteResults,
      }

      let fix: JiraTriageFix | undefined

      if (reproduced && jobPayload.options.attemptFix) {
        fix = await this.fixAttempter.attempt({
          failingSummary: failing.map((suite) => suite.summary ?? suite.command).join('\n\n'),
          issue,
          repository,
          signal: context.signal,
          sourceControlConnection,
          suites,
          workspace,
        })
      }

      if (fix?.succeeded && fix.pullRequestUrl) {
        const escalation = await this.finish({
          comments: jiraComments,
          escalateAccountIdFallback: undefined,
          issues: jiraIssues,
          issueKey: issue.key,
          outcome: 'fix_succeeded',
          projectLead: undefined,
          pullRequestUrl: fix.pullRequestUrl,
          reason: 'Fix succeeded; draft PR linked on the ticket.',
          reassign: false,
          signal: context.signal,
          users: jiraUsers,
        })

        return {
          classification: bugClassification,
          escalation,
          fix,
          issueKey: issue.key,
          repository: this.toResultRepository(repository),
          repro,
        }
      }

      const outcome: JiraTriageFinishOutcome = reproduced
        ? fix?.attempted
          ? 'reproduced_fix_failed'
          : 'reproduced_no_fix'
        : 'not_reproduced'

      const reason = reproduced
        ? fix?.attempted
          ? 'Bug reproduced but fix did not leave tests green.'
          : 'Bug reproduced; autofix disabled.'
        : 'Could not reproduce the reported bug with mapped tests after test authoring.'

      const escalation = await this.finish({
        comments: jiraComments,
        escalateAccountIdFallback: repository.escalateAccountId,
        issues: jiraIssues,
        issueKey: issue.key,
        outcome,
        projectLead: repository.projectLead ?? projectLead,
        reason,
        reassign: true,
        signal: context.signal,
        users: jiraUsers,
      })

      return {
        classification: bugClassification,
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

  private async runSuites(
    issueKey: string,
    suites: Readonly<Record<string, CommandConfiguration>>,
    workingDirectory: string,
    signal: AbortSignal,
  ): Promise<JiraTriageTestSuiteResult[]> {
    try {
      return await this.testRunner.run({
        signal,
        suites,
        workingDirectory,
      })
    } catch (error) {
      if (signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
        throw error
      }

      throw new JiraTriageReproductionError(
        issueKey,
        `Failed to run reproduction suites for Jira issue '${issueKey}'.`,
        { cause: error },
      )
    }
  }

  private failingSuites(suiteResults: readonly JiraTriageTestSuiteResult[]): JiraTriageTestSuiteResult[] {
    return suiteResults.filter((suite) => (suite.exitCode ?? 0) !== 0)
  }

  /**
   * Posts a human finish comment and optional project-lead reassignment.
   *
   * @param input - Outcome, Jira clients, and optional lead config.
   * @returns Escalation result for the job payload.
   */
  private async finish(input: {
    readonly comments: JiraCommentResource
    readonly escalateAccountIdFallback: string | undefined
    readonly issues: JiraIssueResource
    readonly issueKey: string
    readonly outcome: JiraTriageFinishOutcome
    readonly projectLead: JiraProjectRepoLead | undefined
    readonly pullRequestUrl?: string
    readonly reason: string
    readonly reassign: boolean
    readonly signal: AbortSignal
    readonly users: JiraUserResource
  }): Promise<JiraTriageEscalation> {
    const resolved = await this.resolveProjectLead(input.projectLead, input.users, input.signal)
    const mention: JiraCommentMention | undefined = resolved
      ? {
          accountId: resolved.accountId,
          displayName: resolved.displayName,
        }
      : undefined

    return this.escalator.escalate({
      comment: this.escalator.formatFinishComment({
        mentionDisplayName: mention?.displayName,
        outcome: input.outcome,
        pullRequestUrl: input.pullRequestUrl,
      }),
      comments: input.comments,
      escalateAccountId: mention?.accountId ?? input.escalateAccountIdFallback,
      issueKey: input.issueKey,
      issues: input.issues,
      mention,
      reason: input.reason,
      reassign: input.reassign,
      signal: input.signal,
    })
  }

  /**
   * Escalates when allowlisted suites fail before tests can run.
   *
   * @param input - Classification, Jira clients, suite outcomes, and copy.
   * @returns Triage result with {@link JiraTriageRepro.status} `suite_broken`.
   */
  private async finishSuiteBroken(input: {
    readonly classification: JiraTriageClassification
    readonly comments: JiraCommentResource
    readonly issues: JiraIssueResource
    readonly issueKey: string
    readonly projectLead: JiraProjectRepoLead | undefined
    readonly reason: string
    readonly repository: ResolvedJiraRepository
    readonly signal: AbortSignal
    readonly suiteResults: readonly JiraTriageTestSuiteResult[]
    readonly summaryDetail?: string
    readonly summaryPrefix: string
    readonly users: JiraUserResource
  }): Promise<JiraTriageJobResult> {
    const brokenIds = input.suiteResults
      .filter((suite) => isUnrunnableSuiteFailure(suite))
      .map((suite) => suite.suiteId)
    const repro: JiraTriageRepro = {
      status: 'suite_broken',
      summary: [`${input.summaryPrefix}: ${brokenIds.join(', ')}`, input.summaryDetail]
        .filter((part): part is string => part !== undefined)
        .join(' — '),
      suites: [...input.suiteResults],
    }

    const escalation = await this.finish({
      comments: input.comments,
      escalateAccountIdFallback: input.repository.escalateAccountId,
      issues: input.issues,
      issueKey: input.issueKey,
      outcome: 'suite_broken',
      projectLead: input.projectLead,
      reason: input.reason,
      reassign: true,
      signal: input.signal,
      users: input.users,
    })

    return {
      classification: input.classification,
      escalation,
      issueKey: input.issueKey,
      repository: this.toResultRepository(input.repository),
      repro,
    }
  }

  /**
   * Resolves a configured project lead email to a Jira user for mention/assign.
   *
   * Soft-fails to `undefined` when lookup throws so the finish comment still
   * posts without a mention.
   *
   * @param projectLead - Optional lead from project mapping.
   * @param users - Jira user resource.
   * @param signal - Abort signal.
   * @returns Resolved lead identity, or `undefined`.
   */
  private async resolveProjectLead(
    projectLead: JiraProjectRepoLead | undefined,
    users: JiraUserResource,
    signal: AbortSignal,
  ): Promise<{ accountId: string; displayName: string } | undefined> {
    if (!projectLead?.email) {
      return undefined
    }

    try {
      const user = await users.findByEmail(projectLead.email, signal)

      return {
        accountId: user.accountId,
        displayName: projectLead.displayName?.trim() || user.displayName,
      }
    } catch {
      return undefined
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

  private resolveSourceControlConnection(
    connectionId: string | undefined,
    issueKey: string,
  ): SourceControlConnection {
    try {
      if (connectionId) {
        return this.sourceControlConnectionStore.resolve(connectionId)
      }

      const first = this.configuration.sourceControlConnections[0]
      if (!first) {
        throw new JiraTriageReproductionError(
          issueKey,
          'No GitHub source-control connection is configured for jira.triage clone/PR work.',
        )
      }

      return first
    } catch (error) {
      if (error instanceof JiraTriageReproductionError) {
        throw error
      }

      throw new JiraTriageReproductionError(
        issueKey,
        `Failed to resolve a GitHub source-control connection for Jira issue '${issueKey}'.`,
        { cause: error },
      )
    }
  }

  private lookupProjectLead(projectKey: string): JiraProjectRepoLead | undefined {
    return this.configuration.jiraProjectRepos.find(
      (entry) => entry.projectKey.toUpperCase() === projectKey.toUpperCase(),
    )?.projectLead
  }

  private lookupEscalateAccountId(projectKey: string): string | undefined {
    return this.configuration.jiraProjectRepos.find(
      (entry) => entry.projectKey.toUpperCase() === projectKey.toUpperCase(),
    )?.escalateAccountId
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
}
