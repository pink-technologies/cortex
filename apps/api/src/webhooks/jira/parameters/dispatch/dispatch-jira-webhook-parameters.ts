// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Application-layer input for dispatching one verified Jira webhook delivery.
 *
 * Carries delivery fields plus connection defaults after signature verification.
 * {@link dispatchJiraWebhook} uses these values to resolve a registry route and
 * produce a {@link JiraWebhookDecision}.
 */
export interface DispatchJiraWebhookParameters {
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

  /**
   * Route name to resolve from the registry.
   *
   * Required for dispatch. When omitted, the delivery is ignored as
   * {@link JiraWebhookIgnoreReason.MISSING_ROUTE}.
   */
  readonly routeName?: string
}
