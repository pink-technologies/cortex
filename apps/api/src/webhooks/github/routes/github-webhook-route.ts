// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { GitHubWebhookDecision } from '../models'

/**
 * Application-layer input for one registered GitHub webhook route handler.
 *
 * Assembled by the dispatcher after signature verification and event allowlist
 * checks. Route handlers do not re-verify HMAC or re-check {@link GitHubWebhookRoute.events}.
 */
export interface GitHubWebhookRouteHandleParameters {
  /**
   * Parsed JSON body from the HTTP request.
   */
  readonly body: unknown

  /**
   * Source-control connection id applied to enqueued jobs.
   */
  readonly connectionId: string

  /**
   * Value of the `X-GitHub-Delivery` header, when present.
   */
  readonly deliveryId: string | undefined

  /**
   * Resolved `X-GitHub-Event` value (already allowlisted for this route).
   */
  readonly event: string

  /**
   * Optional reviewer guidance applied to enqueued jobs.
   */
  readonly instructions?: string
}

/**
 * GitHub webhook route: event allowlist plus a typed handler.
 *
 * Each route is one product intent (for example repository review). The
 * shared ingress `POST /webhooks/github` dispatches by matching
 * `X-GitHub-Event` to {@link events}, then calls {@link handle}.
 */
export interface GitHubWebhookRoute {
  /**
   * Event types this route accepts (GitHub `X-GitHub-Event` values).
   *
   * When empty, every event type is accepted and filtering is left to
   * {@link handle}. Prefer an explicit list.
   */
  readonly events: readonly string[]

  /**
   * Stable route identifier for logs and registry identity (not part of the URL).
   */
  readonly name: string

  /**
   * Decides whether an allowlisted delivery should enqueue work or be ignored.
   *
   * @param parameters - Verified delivery fields for this route.
   * @returns A {@link GitHubWebhookDecision} to enqueue or ignore.
   */
  handle(parameters: GitHubWebhookRouteHandleParameters): GitHubWebhookDecision
}
