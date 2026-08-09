// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraWebhookIgnoreReason } from './jira-webhook-decision'

/**
 * Discriminator values for {@link JiraWebhookHandleResult}.
 */
export const JiraWebhookHandleAction = {
  ALREADY_ENQUEUED: 'already_enqueued',
  ENQUEUED: 'enqueued',
  IGNORED: 'ignored',
} as const

/** Discriminator for a Jira webhook handle acknowledgement. */
export type JiraWebhookHandleAction = (typeof JiraWebhookHandleAction)[keyof typeof JiraWebhookHandleAction]

/**
 * HTTP acknowledgement when a Jira delivery started a workflow run.
 *
 * Returned by {@link JiraWebhookService.handle} after a mapping decides to
 * enqueue and the orchestrator creates a new run. Part of
 * {@link JiraWebhookHandleResult}; callers identify it via
 * {@link JiraWebhookHandleAction.ENQUEUED}.
 */
export type JiraWebhookEnqueuedResult = {
  /**
   * Delivery started a workflow run with a queued first-step job.
   */
  readonly action: typeof JiraWebhookHandleAction.ENQUEUED

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
export type JiraWebhookAlreadyEnqueuedResult = {
  /**
   * Delivery matched an existing enqueue idempotency key.
   */
  readonly action: typeof JiraWebhookHandleAction.ALREADY_ENQUEUED

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
export type JiraWebhookIgnoredResult = {
  /**
   * Delivery was verified but did not enqueue work.
   */
  readonly action: typeof JiraWebhookHandleAction.IGNORED

  /**
   * Always `true` for a handled delivery acknowledgement.
   */
  readonly ok: true

  /**
   * Machine-readable reason the delivery was ignored.
   */
  readonly reason: JiraWebhookIgnoreReason
}

/**
 * Result returned after processing a Jira webhook delivery.
 *
 * Callers branch on {@link JiraWebhookHandleAction}.
 */
export type JiraWebhookHandleResult =
  | JiraWebhookAlreadyEnqueuedResult
  | JiraWebhookEnqueuedResult
  | JiraWebhookIgnoredResult
