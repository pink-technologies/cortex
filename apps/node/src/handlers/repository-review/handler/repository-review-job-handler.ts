// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { SkillRegistry, SkillSelector, type AgentDefinition } from '@cortex/agent-runtime'
import {
  RepositoryReviewJobKind,
  RepositoryReviewJobPayloadSchema,
  type RepositoryReviewJobResult,
} from '@cortex/protocol'
import type { ExecutionJobHandler, ExecutionJobHandlerContext } from '../../../execution/handler'
import { AgentProcessResolver } from '../../../agent/agent-process-resolver'
import { ConfigSourceControlConnectionStore } from '../../../connection'
import { EXECUTION_ENGINE, type ExecutionEngine } from '../../../execution-engine'
import { GitHubClient, GitHubIssueCommentResource, GitHubPullResource } from '../../../github'
import { GitWorkspaceManager } from '../../../workspace'
import {
  buildRepositoryReviewUserContext,
  composeRepositoryReviewPrompt,
  readAgentsMarkdown,
} from '../composer/repository-review-prompt-composer'
import { mapRepositoryReviewResult } from '../mapper/repository-review-result-mapper'

/**
 * Executes claimed jobs with kind {@link RepositoryReviewJobKind}.
 *
 * Resolves the owning agent package, composes prompts from the agent system
 * prompt, selectively injected skills, optional workspace `AGENTS.md`, and run
 * context, then runs the injected {@link ExecutionEngine}.
 */
@Injectable()
export class RepositoryReviewJobHandler implements ExecutionJobHandler<RepositoryReviewJobResult> {
  readonly kind = RepositoryReviewJobKind

  private readonly skillSelector = new SkillSelector()

  // MARK: - Constructor

  /**
   * Creates a `repository.review` job handler.
   *
   * @param agentProcessResolver - Resolves the agent package that owns reviews.
   * @param connectionStore - Store resolving source-control credentials.
   * @param executionEngine - Engine used to run the composed review prompt.
   * @param skillRegistry - Registry of skills available for selective injection.
   * @param workspaceManager - Prepares git workspaces for review runs.
   */
  constructor(
    private readonly agentProcessResolver: AgentProcessResolver,
    private readonly connectionStore: ConfigSourceControlConnectionStore,
    @Inject(EXECUTION_ENGINE)
    private readonly executionEngine: ExecutionEngine,
    private readonly skillRegistry: SkillRegistry,
    private readonly workspaceManager: GitWorkspaceManager,
  ) {}

  async process(payload: unknown, context: ExecutionJobHandlerContext): Promise<RepositoryReviewJobResult> {
    context.signal.throwIfAborted()

    const jobPayload = RepositoryReviewJobPayloadSchema.parse(payload)
    const connection = this.connectionStore.resolve(jobPayload.connectionId)

    if (connection.provider !== 'github') {
      throw new Error(
        `Source-control provider '${connection.provider}' is not supported by the repository review handler.`,
      )
    }

    const github = new GitHubClient(connection)
    const pulls = new GitHubPullResource(github)
    const comments = new GitHubIssueCommentResource(github)
    const agent = this.agentProcessResolver.resolveAgent(RepositoryReviewJobKind)

    const workspace = await this.workspaceManager.prepare({
      accessToken: connection.token,
      cloneUrl: jobPayload.repository.cloneUrl,
      headRef: jobPayload.change.headRef,
      signal: context.signal,
    })

    try {
      const pullRequest = jobPayload.change.pullRequestNumber
        ? await pulls.get(
            jobPayload.repository.owner,
            jobPayload.repository.name,
            jobPayload.change.pullRequestNumber,
            context.signal,
          )
        : undefined

      const agentsMarkdown = await readAgentsMarkdown(workspace.path)
      const userContext = buildRepositoryReviewUserContext({
        baseRef: jobPayload.change.baseRef,
        headRef: jobPayload.change.headRef,
        instructions: jobPayload.instructions,
        pullRequestBody: pullRequest?.body,
        pullRequestTitle: pullRequest?.title,
        reviewMode: jobPayload.reviewMode,
      })
      const skillPrompts = this.resolveSkillPrompts(agent, userContext)

      const prompt = composeRepositoryReviewPrompt({
        agentsMarkdown,
        skillPrompts,
        systemPrompt: agent.descriptor.systemPrompt,
        userContext,
      })

      const engineResult = await this.executionEngine.run({
        agentId: agent.id,
        cwd: workspace.path,
        prompt,
        signal: context.signal,
      })

      const result = mapRepositoryReviewResult(engineResult.output, jobPayload.reviewMode)

      if (jobPayload.change.pullRequestNumber) {
        await comments.create(
          jobPayload.repository.owner,
          jobPayload.repository.name,
          jobPayload.change.pullRequestNumber,
          this.formatReviewComment(result),
          context.signal,
        )
      }

      return result
    } finally {
      await this.workspaceManager.cleanup(workspace)
    }
  }

  // MARK: - Private methods

  private formatReviewComment(result: RepositoryReviewJobResult): string {
    const findings =
      result.findings.length === 0
        ? '_No findings._'
        : result.findings
            .map((finding) => {
              const location = finding.path
                ? ` (\`${finding.path}\`${finding.startLine ? `:${finding.startLine}` : ''})`
                : ''

              return `- **[${finding.severity}] ${finding.title}**${location}\n  ${finding.detail}`
            })
            .join('\n')

    return [
      `## Cortex repository review (${result.reviewMode})`,
      '',
      result.summary,
      '',
      '### Findings',
      '',
      findings,
    ].join('\n')
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
