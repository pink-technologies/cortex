// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { SkillRegistry, SkillSelector, type AgentDefinition } from '@cortex/agent-runtime'
import {
  JiraTriageJobKind,
  type JiraTriageClassification,
} from '@cortex/protocol'
import type { JiraIssue } from '@cortex/integrations/jira'
import { AgentProcessResolver } from '../../../agent/agent-process-resolver'
import { NODE_CONFIGURATION, type NodeConfiguration } from '../../../configuration'
import { EXECUTION_ENGINE, type ExecutionEngine } from '../../../execution-engine'
import {
  buildJiraClassifyUserContext,
  composeJiraClassifyPrompt,
} from '../composer/jira-triage-prompt-composer'
import { JiraTriageClassificationError } from '../error/error'
import { mapJiraTriageClassification } from '../mapper/jira-triage-classification-mapper'

/**
 * Runs the QA classify step for a Jira triage job.
 *
 * Owns prompt composition, skill selection, execution-engine invocation, and
 * mapping the model output to {@link JiraTriageClassification}.
 */
@Injectable()
export class JiraTriageClassifier {
  // MARK: - Private Properties

  private readonly skillSelector = new SkillSelector()

  // MARK: - Constructor

  /**
   * Creates a Jira triage classifier.
   *
   * @param agentProcessResolver - Resolves the QA agent for `jira.triage`.
   * @param configuration - Node configuration with optional project area catalogs.
   * @param executionEngine - Engine used to run the classify prompt.
   * @param skillRegistry - Registry of skills available for selective injection.
   */
  constructor(
    private readonly agentProcessResolver: AgentProcessResolver,
    @Inject(NODE_CONFIGURATION)
    private readonly configuration: NodeConfiguration,
    @Inject(EXECUTION_ENGINE)
    private readonly executionEngine: ExecutionEngine,
    private readonly skillRegistry: SkillRegistry,
  ) {}

  // MARK: - Instance methods

  /**
   * Classifies a loaded Jira issue.
   *
   * @param issue - Issue already fetched from Jira.
   * @param signal - Cancellation signal for the engine run.
   * @returns Structured classification for the triage handler.
   * @throws {@link JiraTriageClassificationError} when the engine or mapper fails.
   */
  async classify(issue: JiraIssue, signal: AbortSignal): Promise<JiraTriageClassification> {
    signal.throwIfAborted()

    const qaAgent = this.agentProcessResolver.resolveAgent(JiraTriageJobKind)
    const areaCatalog = this.resolveAreaCatalog(issue.projectKey)
    const classifyUserContext = buildJiraClassifyUserContext(issue, areaCatalog)
    const skillPrompts = this.resolveSkillPrompts(qaAgent, classifyUserContext)
    const classifyPrompt = composeJiraClassifyPrompt({
      skillPrompts,
      systemPrompt: qaAgent.descriptor.systemPrompt,
      userContext: classifyUserContext,
    })

    try {
      const classifyOutput = await this.executionEngine.run({
        agentId: qaAgent.id,
        cwd: process.cwd(),
        prompt: classifyPrompt,
        signal,
      })

      return mapJiraTriageClassification(classifyOutput.output)
    } catch (error) {
      throw new JiraTriageClassificationError(
        `Failed to classify Jira issue '${issue.key}'.`,
        {
          cause: error,
          issueKey: issue.key,
        },
      )
    }
  }

  // MARK: - Private methods

  private resolveAreaCatalog(projectKey: string): readonly string[] {
    const mapping = this.configuration.jiraProjectRepos.find(
      (entry) => entry.projectKey.toUpperCase() === projectKey.toUpperCase(),
    )

    return Object.keys(mapping?.areas ?? {})
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
