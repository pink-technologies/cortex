// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraWebhookDecision } from '../models'

/**
 * Application-layer input for one registered Jira webhook route handler.
 *
 * Assembled by the dispatcher after signature verification and event allowlist
 * checks. Route handlers do not re-verify HMAC or re-check {@link JiraWebhookRoute.events}.
 */
export interface JiraWebhookRouteHandleParameters {
  /**
   * Optional automation assignee account id used as an ingress gate.
   */
  readonly automationAssigneeAccountId?: string

  /**
   * Parsed JSON body from the HTTP request.
   */
  readonly body: unknown

  /**
   * Jira connection id applied to enqueued jobs.
   */
  readonly connectionId: string
}

/**
 * Jira webhook route: event allowlist plus a typed handler.
 *
 * Each route is one product intent (for example Jira triage). The dispatcher
 * resolves the route, filters on {@link events}, then calls {@link handle}.
 */
export interface JiraWebhookRoute {
  /**
   * Event types this route accepts (`webhookEvent` values from the body).
   *
   * When empty, every event type is accepted and filtering is left to
   * {@link handle}. Prefer an explicit list.
   */
  readonly events: readonly string[]

  /**
   * Stable route identifier.
   */
  readonly name: string

  /**
   * Decides whether an allowlisted delivery should enqueue work or be ignored.
   *
   * @param parameters - Verified delivery fields for this route.
   * @returns A {@link JiraWebhookDecision} to enqueue or ignore.
   */
  handle(parameters: JiraWebhookRouteHandleParameters): JiraWebhookDecision
}
