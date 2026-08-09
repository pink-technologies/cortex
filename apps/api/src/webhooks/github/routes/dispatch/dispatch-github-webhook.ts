// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  GitHubWebhookDecisionKind,
  GitHubWebhookIgnoreReason,
  type GitHubWebhookDecision,
  type GitHubWebhookIgnoreDecision,
} from '../../models'
import type { DispatchGitHubWebhookParameters } from '../../parameters/dispatch/dispatch-github-webhook-parameters'
import { GITHUB_WEBHOOK_ROUTES } from '../github-webhook-route-registry'

/**
 * Dispatches a verified GitHub webhook delivery to registered routes.
 *
 * Selects handlers by `X-GitHub-Event` against each route's {@link GitHubWebhookRoute.events}
 * allowlist. When several routes match, the first that returns
 * {@link GitHubWebhookDecisionKind.ENQUEUE} wins; if all ignore, the first
 * ignore decision is returned.
 *
 * @param parameters - Delivery fields plus connection configuration.
 * @returns A {@link GitHubWebhookDecision} to enqueue or ignore.
 */
export function dispatchGitHubWebhook(parameters: DispatchGitHubWebhookParameters): GitHubWebhookDecision {
  const event = parameters.event

  if (!event) {
    return {
      kind: GitHubWebhookDecisionKind.IGNORE,
      reason: GitHubWebhookIgnoreReason.MISSING_EVENT,
    }
  }

  if (event === 'ping') {
    return {
      kind: GitHubWebhookDecisionKind.IGNORE,
      reason: GitHubWebhookIgnoreReason.PING,
    }
  }

  const matchingRoutes = [...GITHUB_WEBHOOK_ROUTES.values()].filter(
    (route) => route.events.length === 0 || route.events.includes(event),
  )

  if (matchingRoutes.length === 0) {
    return {
      kind: GitHubWebhookDecisionKind.IGNORE,
      reason: `unsupported_event:${event}`,
    }
  }

  let firstIgnore: GitHubWebhookIgnoreDecision | undefined

  for (const route of matchingRoutes) {
    const decision = route.handle({
      body: parameters.body,
      connectionId: parameters.connectionId,
      deliveryId: parameters.deliveryId,
      event,
      ...(parameters.instructions ? { instructions: parameters.instructions } : {}),
    })

    if (decision.kind === GitHubWebhookDecisionKind.ENQUEUE) {
      return decision
    }

    firstIgnore ??= decision
  }

  return (
    firstIgnore ?? {
      kind: GitHubWebhookDecisionKind.IGNORE,
      reason: `unsupported_event:${event}`,
    }
  )
}
