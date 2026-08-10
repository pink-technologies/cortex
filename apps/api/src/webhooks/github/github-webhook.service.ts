// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common'
import { API_CONFIGURATION, type ApiConfiguration } from '@/configuration'
import { ExecutionJobSourceType } from '@/execution/models'
import { WorkflowOrchestrator } from '@/workflow/orchestrator'
import { GitHubWebhookDecisionKind, GitHubWebhookHandleAction, type GitHubWebhookHandleResult } from './models'
import { type GitHubWebhookHandleParameters } from './parameters'
import { dispatchGitHubWebhook } from './routes'
import { verifyGitHubWebhookSignature } from './signature'

/**
 * Verifies GitHub webhook authenticity and starts workflow runs for matching
 * event handlers.
 *
 * Configure GitHub to `POST /api/webhooks/github`. Handlers are selected by
 * `X-GitHub-Event` from the route registry (for example `pull_request` →
 * repository review).
 *
 * Configuration (from env via {@link ApiConfiguration}):
 * - `GITHUB_WEBHOOK_SECRET` — shared HMAC secret
 * - `GITHUB_DEFAULT_CONNECTION_ID` — Node `connections.toml` source-control connection id
 * - `GITHUB_REVIEW_INSTRUCTIONS` — optional default reviewer guidance
 */
@Injectable()
export class GitHubWebhookService {
  // MARK: - Constructor

  /**
   * Creates a GitHub webhook verification and enqueue service.
   *
   * @param configuration - Validated API configuration providing webhook secrets.
   * @param orchestrator - Orchestrator used to start review workflow runs.
   */
  constructor(
    @Inject(API_CONFIGURATION)
    private readonly configuration: ApiConfiguration,
    private readonly orchestrator: WorkflowOrchestrator,
  ) {}

  // MARK: - Instance methods

  /**
   * Handles one GitHub webhook delivery.
   *
   * @param parameters - Raw body, signature headers, and parsed JSON body.
   * @returns Acknowledgement describing whether a run was started or ignored.
   */
  async handle(parameters: GitHubWebhookHandleParameters): Promise<GitHubWebhookHandleResult> {
    const configuration = this.requireConfiguration()

    if (!verifyGitHubWebhookSignature(parameters.rawBody, parameters.signatureHeader, configuration.secret)) {
      throw new UnauthorizedException('Invalid GitHub webhook signature.')
    }

    const decision = dispatchGitHubWebhook({
      body: parameters.body,
      connectionId: configuration.connectionId,
      deliveryId: parameters.deliveryId,
      event: parameters.event,
      ...(configuration.instructions ? { instructions: configuration.instructions } : {}),
    })

    if (decision.kind === GitHubWebhookDecisionKind.IGNORE) {
      return {
        action: GitHubWebhookHandleAction.IGNORED,
        ok: true,
        reason: decision.reason,
      }
    }

    const result = await this.orchestrator.start({
      definitionKey: decision.definitionKey,
      input: decision.payload,
      triggerIdentifier: decision.triggerIdentifier,
      source: {
        identifier: parameters.deliveryId ?? decision.triggerIdentifier,
        type: ExecutionJobSourceType.WEBHOOK,
      },
    })

    if (!result.created) {
      return {
        ok: true,
        action: GitHubWebhookHandleAction.ALREADY_ENQUEUED,
        reason: decision.triggerIdentifier,
      }
    }

    return {
      ok: true,
      action: GitHubWebhookHandleAction.ENQUEUED,
      jobId: result.job.id,
      runId: result.run.id,
    }
  }

  // MARK: - Private methods

  private requireConfiguration(): {
    connectionId: string
    instructions?: string
    secret: string
  } {
    const secret = this.configuration.githubWebhookSecret
    const connectionId = this.configuration.githubDefaultConnectionId
    const instructions = this.configuration.githubReviewInstructions

    if (!secret || !connectionId) {
      throw new ServiceUnavailableException(
        'GitHub webhook is not configured. Set GITHUB_WEBHOOK_SECRET and GITHUB_DEFAULT_CONNECTION_ID.',
      )
    }

    return {
      connectionId,
      ...(instructions ? { instructions } : {}),
      secret,
    }
  }
}
