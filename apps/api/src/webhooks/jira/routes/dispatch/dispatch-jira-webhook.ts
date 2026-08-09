// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraWebhookDecisionKind, JiraWebhookIgnoreReason, type JiraWebhookDecision } from '../../models'
import type { DispatchJiraWebhookParameters } from '../../parameters/dispatch/dispatch-jira-webhook-parameters'
import { JIRA_WEBHOOK_ROUTES } from '../jira-webhook-route-registry'

/**
 * Dispatches a verified Jira webhook delivery to a registered route.
 *
 * Resolves the route from {@link JIRA_WEBHOOK_ROUTES} by explicit name, checks
 * the route event allowlist against body `webhookEvent` when present, then
 * calls {@link JiraWebhookRoute.handle}.
 *
 * @param parameters - Delivery fields plus connection configuration.
 * @returns A {@link JiraWebhookDecision} to enqueue or ignore.
 */
export function dispatchJiraWebhook(parameters: DispatchJiraWebhookParameters): JiraWebhookDecision {
  if (!parameters.routeName) {
    return {
      kind: JiraWebhookDecisionKind.IGNORE,
      reason: JiraWebhookIgnoreReason.MISSING_ROUTE,
    }
  }

  const route = JIRA_WEBHOOK_ROUTES.get(parameters.routeName)

  if (!route) {
    return {
      kind: JiraWebhookDecisionKind.IGNORE,
      reason: `unsupported_route:${parameters.routeName}`,
    }
  }

  const event = readWebhookEvent(parameters.body)

  if (event && route.events.length > 0 && !route.events.includes(event)) {
    return {
      kind: JiraWebhookDecisionKind.IGNORE,
      reason: `unsupported_event:${event}`,
    }
  }

  return route.handle({
    body: parameters.body,
    connectionId: parameters.connectionId,
    ...(parameters.automationAssigneeAccountId
      ? { automationAssigneeAccountId: parameters.automationAssigneeAccountId }
      : {}),
  })
}

function readWebhookEvent(body: unknown): string | undefined {
  if (body === null || typeof body !== 'object') {
    return undefined
  }

  const value = (body as { webhookEvent?: unknown }).webhookEvent
  return typeof value === 'string' ? value : undefined
}
