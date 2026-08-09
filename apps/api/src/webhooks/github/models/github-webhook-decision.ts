// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { RepositoryReviewJobPayload } from '@cortex/protocol'
import { repositoryReviewFlow } from '@/workflow/definitions'

/**
 * Discriminator values for {@link GitHubWebhookDecision}.
 */
export const GitHubWebhookDecisionKind = {
  ENQUEUE: 'enqueue',
  IGNORE: 'ignore',
} as const

/** Discriminator for a GitHub webhook route decision. */
export type GitHubWebhookDecisionKind = (typeof GitHubWebhookDecisionKind)[keyof typeof GitHubWebhookDecisionKind]

/**
 * Fixed ignore reasons for a GitHub webhook decision.
 *
 * Parameterized reasons use `unsupported_event:<event>` and
 * `unsupported_action:<action>` template forms on
 * {@link GitHubWebhookIgnoreReason}.
 */
export const GitHubWebhookIgnoreReason = {
  DRAFT_PULL_REQUEST: 'draft_pull_request',
  INVALID_PULL_REQUEST_PAYLOAD: 'invalid_pull_request_payload',
  MISSING_EVENT: 'missing_event',
  PING: 'ping',
} as const

/**
 * Machine-readable reason a GitHub delivery was not selected for enqueue.
 */
export type GitHubWebhookIgnoreReason =
  | (typeof GitHubWebhookIgnoreReason)[keyof typeof GitHubWebhookIgnoreReason]
  | `unsupported_action:${string}`
  | `unsupported_event:${string}`

/**
 * Enqueue decision for the `repository-review` route.
 *
 * Discriminated by {@link definitionKey}. Add parallel arms when new routes
 * enqueue different workflow definitions.
 */
export type GitHubRepositoryReviewEnqueueDecision = {
  /**
   * Registry key for the repository review flow.
   */
  readonly definitionKey: typeof repositoryReviewFlow.key

  /**
   * Delivery should start a workflow run with a first-step job.
   */
  readonly kind: typeof GitHubWebhookDecisionKind.ENQUEUE

  /**
   * First-step job payload for {@link repositoryReviewFlow}.
   */
  readonly payload: RepositoryReviewJobPayload

  /**
   * Idempotency key for the workflow run.
   */
  readonly triggerIdentifier: string
}

/**
 * Decision to enqueue work for a GitHub delivery.
 *
 * Discriminated union of route-specific enqueue arms. Narrow with
 * {@link definitionKey} (or exhaustiveness on new arms).
 */
export type GitHubWebhookEnqueueDecision = GitHubRepositoryReviewEnqueueDecision

/**
 * Decision to skip enqueue for a GitHub delivery.
 */
export type GitHubWebhookIgnoreDecision = {
  /**
   * Delivery should not enqueue work.
   */
  readonly kind: typeof GitHubWebhookDecisionKind.IGNORE

  /**
   * Machine-readable reason the delivery was ignored.
   */
  readonly reason: GitHubWebhookIgnoreReason
}

/**
 * Decision from a GitHub webhook route: enqueue work, or ignore.
 *
 * Produced by {@link GitHubWebhookRoute.handle} after signature verification and
 * event allowlisting. Callers branch on {@link GitHubWebhookDecisionKind}.
 */
export type GitHubWebhookDecision = GitHubWebhookEnqueueDecision | GitHubWebhookIgnoreDecision
