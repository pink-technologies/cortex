// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { GitHubWebhookIgnoreReason } from './github-webhook-decision'

/**
 * Discriminator values for {@link GitHubWebhookHandleResult}.
 */
export const GitHubWebhookHandleAction = {
  ALREADY_ENQUEUED: 'already_enqueued',
  ENQUEUED: 'enqueued',
  IGNORED: 'ignored',
} as const

/** Discriminator for a GitHub webhook handle acknowledgement. */
export type GitHubWebhookHandleAction = (typeof GitHubWebhookHandleAction)[keyof typeof GitHubWebhookHandleAction]

/**
 * HTTP acknowledgement when a GitHub delivery started a workflow run.
 *
 * Returned by {@link GitHubWebhookService.handle} after a route decides to
 * enqueue and the orchestrator creates a new run. Part of
 * {@link GitHubWebhookHandleResult}; callers identify it via
 * {@link GitHubWebhookHandleAction.ENQUEUED}.
 */
export type GitHubWebhookEnqueuedResult = {
  /**
   * Delivery started a workflow run with a queued first-step job.
   */
  readonly action: typeof GitHubWebhookHandleAction.ENQUEUED

  /**
   * Identifier of the first-step execution job.
   */
  readonly jobId: string

  /**
   * Always `true` for a handled delivery acknowledgement.
   */
  readonly ok: true

  /**
   * Identifier of the started workflow run.
   */
  readonly runId: string
}

/**
 * Acknowledgement when a delivery matched an existing enqueue idempotency key.
 */
export type GitHubWebhookAlreadyEnqueuedResult = {
  /**
   * Delivery matched an existing enqueue idempotency key.
   */
  readonly action: typeof GitHubWebhookHandleAction.ALREADY_ENQUEUED

  /**
   * Always `true` for a handled delivery acknowledgement.
   */
  readonly ok: true

  /**
   * Trigger identifier that already owns a job.
   */
  readonly reason: string
}

/**
 * Acknowledgement when a verified delivery did not enqueue work.
 */
export type GitHubWebhookIgnoredResult = {
  /**
   * Delivery was verified but did not enqueue work.
   */
  readonly action: typeof GitHubWebhookHandleAction.IGNORED

  /**
   * Always `true` for a handled delivery acknowledgement.
   */
  readonly ok: true

  /**
   * Machine-readable reason the delivery was ignored.
   */
  readonly reason: GitHubWebhookIgnoreReason
}

/**
 * Result returned to GitHub after processing a webhook delivery.
 *
 * Callers branch on {@link GitHubWebhookHandleAction}.
 */
export type GitHubWebhookHandleResult =
  | GitHubWebhookAlreadyEnqueuedResult
  | GitHubWebhookEnqueuedResult
  | GitHubWebhookIgnoredResult
