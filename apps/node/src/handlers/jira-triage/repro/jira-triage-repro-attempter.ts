// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { SkillRegistry, SkillSelector, type AgentDefinition } from '@cortex/agent-runtime'
import type { JiraIssue } from '@cortex/integrations/jira'
import { AgentProcessResolver } from '../../../agent/agent-process-resolver'
import {
  formatCommandConfiguration,
  type CommandConfiguration,
} from '../../../connection'
import { EXECUTION_ENGINE, type ExecutionEngine } from '../../../execution-engine'
import type { PreparedWorkspace } from '../../../workspace'
import { GitWorkspaceManager } from '../../../workspace'
import { buildJiraReproPrompt } from '../composer/jira-triage-prompt-composer'
import { JiraTriageReproError } from '../error/error'
import { JiraTriageFixAgentId, resolveFixSummary } from '../fix/jira-triage-fix-attempter'

/**
 * Outcome of a regression-test authoring attempt after suites were initially green.
 */
export type JiraTriageReproAuthoringResult = {
  readonly attempted: true
  readonly branchName: string
  readonly committed: boolean
  readonly summary: string
}

/**
 * Inputs for authoring failing regression tests in a prepared workspace.
 */
export type JiraTriageReproAttemptRequest = {
  readonly issue: JiraIssue
  readonly signal: AbortSignal
  readonly suites: Readonly<Record<string, CommandConfiguration>>
  readonly workspace: PreparedWorkspace
}

/**
 * Runs the coder agent to add or adjust tests when allowlisted suites are green.
 *
 * Owns branch creation, prompt composition, engine invocation, and an optional
 * commit. Does not execute shell suites itself — the handler re-runs
 * allowlisted commands via {@link TestRunner}.
 */
@Injectable()
export class JiraTriageReproAttempter {
  // MARK: - Private Properties

  private readonly skillSelector = new SkillSelector()

  // MARK: - Constructor

  /**
   * Creates a Jira triage repro attempter.
   *
   * @param agentProcessResolver - Resolves the coder agent by id.
   * @param executionEngine - Engine used for the repro-authoring agent run.
   * @param skillRegistry - Registry of skills available for selective injection.
   * @param workspaceManager - Git branch/commit operations in the workspace.
   */
  constructor(
    private readonly agentProcessResolver: AgentProcessResolver,
    @Inject(EXECUTION_ENGINE)
    private readonly executionEngine: ExecutionEngine,
    private readonly skillRegistry: SkillRegistry,
    private readonly workspaceManager: GitWorkspaceManager,
  ) {}

  // MARK: - Instance methods

  /**
   * Attempts to author a failing regression that mapped suites will execute.
   *
   * @param input - Issue context, allowlisted suite commands, and workspace.
   * @returns Whether a commit was produced and a short summary.
   * @throws {@link JiraTriageReproError} for fatal agent/git failures.
   */
  async attempt(input: JiraTriageReproAttemptRequest): Promise<JiraTriageReproAuthoringResult> {
    input.signal.throwIfAborted()

    let coderAgent: AgentDefinition
    try {
      coderAgent = this.agentProcessResolver.resolveAgentById(JiraTriageFixAgentId)
    } catch (error) {
      throw new JiraTriageReproError(
        input.issue.key,
        `Coder agent '${JiraTriageFixAgentId}' is required for jira.triage repro authoring.`,
        { cause: error },
      )
    }

    const suiteCommands = Object.entries(input.suites).map(([suiteId, command]) => ({
      command: formatCommandConfiguration(command),
      suiteId,
    }))

    const reproContext = [
      input.issue.key,
      input.issue.summary,
      'regression test',
      ...suiteCommands.map((suite) => suite.command),
    ].join(' ')
    const skillPrompts = this.resolveSkillPrompts(coderAgent, reproContext)
    const branchName = `cortex/jira-repro-${input.issue.key.toLowerCase()}-${Date.now()}`

    try {
      await this.workspaceManager.createBranch(input.workspace, branchName, input.signal)

      const prompt = buildJiraReproPrompt({
        issue: input.issue,
        skillPrompts,
        suiteCommands,
        systemPrompt: coderAgent.descriptor.systemPrompt,
      })

      const engineResult = await this.executionEngine.run({
        agentId: coderAgent.id,
        cwd: input.workspace.path,
        prompt,
        signal: input.signal,
      })

      const summary = resolveFixSummary(engineResult.output) ?? 'Agent repro authoring attempt completed.'

      const committed = await this.workspaceManager.commitAll(
        input.workspace,
        `test(${input.issue.key}): ${summary}`,
        input.signal,
      )

      return {
        attempted: true,
        branchName,
        committed,
        summary: committed ? summary : 'Agent produced no commit while authoring regression tests.',
      }
    } catch (error) {
      if (input.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
        throw error
      }

      throw new JiraTriageReproError(
        input.issue.key,
        `Failed to author regression tests for Jira issue '${input.issue.key}'.`,
        { cause: error },
      )
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
