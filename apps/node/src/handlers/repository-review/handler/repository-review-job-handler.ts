// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { SkillRegistry, SkillSelector, type AgentDefinition } from '@cortex/agent-runtime'
import type { ExecutionJobHandler, ExecutionJobHandlerContext } from '../../../execution/handler'
import { AgentProcessResolver } from '../../../agent/agent-process-resolver'
import { ConfigSourceControlConnectionStore } from '../../../connection'
import { EXECUTION_ENGINE, type ExecutionEngine } from '../../../execution-engine'
import { GitHubClient, GitHubIssueCommentResource, GitHubPullResource } from '@cortex/integrations/github'
import { GitWorkspaceManager } from '../../../workspace'
import { formatRepositoryReviewComment } from '../mapper/repository-review-comment-formatter'
import { mapRepositoryReviewResult } from '../mapper/repository-review-result-mapper'
import {
  RepositoryReviewJobKind,
  RepositoryReviewJobPayloadSchema,
  type RepositoryReviewJobResult,
} from '@cortex/protocol'

import {
  buildRepositoryReviewUserContext,
  composeRepositoryReviewPrompt,
  loadRepositoryReviewPromptContext,
  RepositoryReviewDiffSkillId,
} from '../composer/repository-review-prompt-composer'
import { validateAndScoreRepositoryReviewRules } from '../rules/validate-and-score-repository-review-rules'

/**
 * Executes claimed jobs with kind {@link RepositoryReviewJobKind}.
 *
 * Resolves the owning agent package, composes prompts from the agent system
 * prompt, the required `code-review-diff` skill, optional additional skills,
 * host-loaded repository guidelines, and run context, then runs the injected
 * {@link ExecutionEngine}.
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

  // MARK: - ExecutionJobHandler

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
      baseRef: jobPayload.change.baseRef,
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

      const promptContext = await loadRepositoryReviewPromptContext(
        workspace.path,
        workspace.mergeBaseSha,
        context.signal,
      )
      const userContext = buildRepositoryReviewUserContext({
        baseRef: jobPayload.change.baseRef,
        headRef: jobPayload.change.headRef,
        instructions: jobPayload.instructions,
        mergeBaseSha: workspace.mergeBaseSha,
        pullRequestBody: pullRequest?.body,
        pullRequestTitle: pullRequest?.title,
        reviewMode: jobPayload.reviewMode,
      })
      const skillPrompts = this.resolveSkillPrompts(agent, userContext)

      const prompt = composeRepositoryReviewPrompt({
        applicableRulesPrompt: promptContext.applicableRulesPrompt,
        guidelinesPrompt: promptContext.guidelinesPrompt,
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

      const result = validateAndScoreRepositoryReviewRules(
        mapRepositoryReviewResult(engineResult.output),
        promptContext.applicableRules,
      )

      if (jobPayload.change.pullRequestNumber) {
        await comments.create(
          {
            owner: jobPayload.repository.owner,
            repository: jobPayload.repository.name,
            issueNumber: jobPayload.change.pullRequestNumber,
            body: formatRepositoryReviewComment(result),
          },
          context.signal,
        )
      }

      return result
    } finally {
      await this.workspaceManager.cleanup(workspace)
    }
  }

  // MARK: - Private methods

  private resolveSkillPrompts(agent: AgentDefinition, context: string): readonly string[] {
    const prompts: string[] = []
    const injectedIds = new Set<string>()

    try {
      const required = this.skillRegistry.resolve(RepositoryReviewDiffSkillId)
      prompts.push(required.prompt)
      injectedIds.add(required.id)
    } catch (error) {
      throw new Error(
        `repository.review requires the '${RepositoryReviewDiffSkillId}' skill to be registered.`,
        { cause: error },
      )
    }

    if (!agent.safety.allowSkillUse) {
      return prompts
    }

    const additionalAuthorized = agent.descriptor.skills
      .filter((skillId) => skillId !== RepositoryReviewDiffSkillId)
      .map((skillId) => this.skillRegistry.resolve(skillId))

    for (const skill of this.skillSelector.select({ context, skills: additionalAuthorized })) {
      if (injectedIds.has(skill.id)) {
        continue
      }

      prompts.push(skill.prompt)
      injectedIds.add(skill.id)
    }

    return prompts
  }
}
