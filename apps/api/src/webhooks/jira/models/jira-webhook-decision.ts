// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraTriageJobPayload } from '@cortex/protocol'
import { jiraTriageFlow } from '@/workflow/definitions'
/**
 * Discriminator values for {@link JiraWebhookDecision}.
 */
export const JiraWebhookDecisionKind = {
  ENQUEUE: 'enqueue',
  IGNORE: 'ignore',
} as const

/** Discriminator for a Jira webhook route decision. */
export type JiraWebhookDecisionKind = (typeof JiraWebhookDecisionKind)[keyof typeof JiraWebhookDecisionKind]

/**
 * Fixed ignore reasons for a Jira webhook decision.
 *
 * Parameterized reasons use `unsupported_event:<event>` and
 * `unsupported_route:<name>` template forms on {@link JiraWebhookIgnoreReason}.
 */
export const JiraWebhookIgnoreReason = {
  ASSIGNEE_GATE: 'assignee_gate',
  INVALID_JIRA_PAYLOAD: 'invalid_jira_payload',
  MISSING_ROUTE: 'missing_route',
} as const

/**
 * Machine-readable reason a Jira delivery was not selected for enqueue.
 */
export type JiraWebhookIgnoreReason =
  | (typeof JiraWebhookIgnoreReason)[keyof typeof JiraWebhookIgnoreReason]
  | `unsupported_event:${string}`
  | `unsupported_route:${string}`

/**
 * Enqueue decision for the `jira-triage` route.
 *
 * Discriminated by {@link definitionKey}. Add parallel arms when new routes
 * enqueue different workflow definitions.
 */
export type JiraTriageEnqueueDecision = {
  /**
   * Active-run uniqueness key for triage (`jira.triage:<issueKey>`).
   */
  readonly activeKey: string

  /**
   * Registry key for the Jira triage flow.
   */
  readonly definitionKey: typeof jiraTriageFlow.key

  /**
   * Delivery should start a workflow run with a first-step job.
   */
  readonly kind: typeof JiraWebhookDecisionKind.ENQUEUE

  /**
   * First-step job payload for {@link jiraTriageFlow}.
   */
  readonly payload: JiraTriageJobPayload

  /**
   * Idempotency key for the workflow run.
   */
  readonly triggerIdentifier: string
}

/**
 * Decision to enqueue work for a Jira delivery.
 *
 * Discriminated union of route-specific enqueue arms. Narrow with
 * {@link definitionKey} (or exhaustiveness on new arms).
 */
export type JiraWebhookEnqueueDecision = JiraTriageEnqueueDecision

/**
 * Decision to skip enqueue for a Jira delivery.
 */
export type JiraWebhookIgnoreDecision = {
  /**
   * Delivery should not enqueue work.
   */
  readonly kind: typeof JiraWebhookDecisionKind.IGNORE

  /**
   * Machine-readable reason the delivery was ignored.
   */
  readonly reason: JiraWebhookIgnoreReason
}

/**
 * Decision from a Jira webhook route: enqueue work, or ignore.
 *
 * Produced by {@link JiraWebhookRoute.handle} after signature verification and
 * event allowlisting. Callers branch on {@link JiraWebhookDecisionKind}.
 */
export type JiraWebhookDecision = JiraWebhookEnqueueDecision | JiraWebhookIgnoreDecision
