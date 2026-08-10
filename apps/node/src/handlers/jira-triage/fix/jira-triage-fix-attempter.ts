// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { SkillRegistry, SkillSelector, type AgentDefinition } from '@cortex/agent-runtime'
import type { JiraTriageFix } from '@cortex/protocol'
import { GitHubClient, GitHubPullResource } from '@cortex/integrations/github'
import type { JiraIssue } from '@cortex/integrations/jira'
import { AgentProcessResolver } from '../../../agent/agent-process-resolver'
import type { CommandConfiguration, SourceControlConnection } from '../../../connection'
import { EXECUTION_ENGINE, type ExecutionEngine } from '../../../execution-engine'
import type { PreparedWorkspace } from '../../../workspace'
import { GitWorkspaceManager } from '../../../workspace'
import { buildJiraFixPrompt } from '../composer/jira-triage-prompt-composer'
import { JiraTriageFixError } from '../error/error'
import { extractJsonObject } from '../mapper/jira-triage-classification-mapper'
import type { ResolvedJiraRepository } from '../models'
import { TestRunner } from '../runner/test-runner'

/**
 * Stable agent package id used for Jira triage autofix attempts.
 *
 * Distinct from the QA agent that owns `jira.triage` classification.
 */
export const JiraTriageFixAgentId = 'coder'

/**
 * Inputs for a reproduced-bug autofix attempt.
 */
export type JiraTriageFixAttemptRequest = {
  readonly failingSummary: string
  readonly issue: JiraIssue
  readonly repository: ResolvedJiraRepository
  readonly signal: AbortSignal
  readonly sourceControlConnection: SourceControlConnection
  readonly suites: Readonly<Record<string, CommandConfiguration>>
  readonly workspace: PreparedWorkspace
}

/**
 * Runs the coder agent against a prepared workspace after a successful repro.
 *
 * Owns branch creation, prompt composition, engine invocation, commit, retest,
 * push, and draft-PR creation. Uses the real {@link PreparedWorkspace} from
 * clone/repro rather than reconstructing a path-only workspace.
 */
@Injectable()
export class JiraTriageFixAttempter {
  // MARK: - Private Properties

  private readonly skillSelector = new SkillSelector()

  // MARK: - Constructor

  /**
   * Creates a Jira triage fix attempter.
   *
   * @param agentProcessResolver - Resolves the coder agent by id.
   * @param executionEngine - Engine used for the autofix agent run.
   * @param skillRegistry - Registry of skills available for selective injection.
   * @param testRunner - Re-runs allowlisted suites after the agent commits.
   * @param workspaceManager - Git branch/commit/push operations in the workspace.
   */
  constructor(
    private readonly agentProcessResolver: AgentProcessResolver,
    @Inject(EXECUTION_ENGINE)
    private readonly executionEngine: ExecutionEngine,
    private readonly skillRegistry: SkillRegistry,
    private readonly testRunner: TestRunner,
    private readonly workspaceManager: GitWorkspaceManager,
  ) {}

  // MARK: - Instance methods

  /**
   * Attempts an autofix and optional draft PR for a reproduced bug.
   *
   * @param input - Repro context and prepared workspace.
   * @returns Structured fix outcome for the triage job result.
   * @throws {@link JiraTriageFixError} for fatal agent/git/PR failures.
   */
  async attempt(input: JiraTriageFixAttemptRequest): Promise<JiraTriageFix> {
    input.signal.throwIfAborted()

    let coderAgent: AgentDefinition
    try {
      coderAgent = this.agentProcessResolver.resolveAgentById(JiraTriageFixAgentId)
    } catch (error) {
      throw new JiraTriageFixError(
        input.issue.key,
        `Coder agent '${JiraTriageFixAgentId}' is required for jira.triage autofix.`,
        { cause: error },
      )
    }

    const fixContext = [input.issue.key, input.issue.summary, input.failingSummary, 'fix', 'pull request'].join(' ')
    const skillPrompts = this.resolveSkillPrompts(coderAgent, fixContext)
    const branchName = `cortex/jira-${input.issue.key.toLowerCase()}-${Date.now()}`

    try {
      await this.workspaceManager.createBranch(input.workspace, branchName, input.signal)

      const prompt = buildJiraFixPrompt({
        failingSummary: input.failingSummary,
        issue: input.issue,
        skillPrompts,
        systemPrompt: coderAgent.descriptor.systemPrompt,
      })

      const engineResult = await this.executionEngine.run({
        agentId: coderAgent.id,
        cwd: input.workspace.path,
        prompt,
        signal: input.signal,
      })

      const fixSummary = resolveFixSummary(engineResult.output) ?? 'Agent fix attempt completed.'

      const committed = await this.workspaceManager.commitAll(
        input.workspace,
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
        workingDirectory: input.workspace.path,
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
        workspace: input.workspace,
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
    } catch (error) {
      if (input.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
        throw error
      }

      throw new JiraTriageFixError(input.issue.key, `Failed to autofix Jira issue '${input.issue.key}'.`, {
        cause: error,
      })
    }
  }

  // MARK: - Private methods

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

/**
 * Parses a coder-agent fix summary from raw engine output.
 *
 * @returns Trimmed summary text, or `undefined` when absent/invalid.
 */
export function resolveFixSummary(output: string): string | undefined {
  if (output.trim().length === 0) {
    return undefined
  }

  try {
    const summary = (extractJsonObject(output) as { summary?: unknown }).summary
    if (typeof summary !== 'string') {
      return undefined
    }

    const trimmed = summary.trim()
    return trimmed.length > 0 ? trimmed : undefined
  } catch {
    return undefined
  }
}
