// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraTriageJobPayload } from '@cortex/protocol'
import { jiraTriageFlow } from '@/workflow/definitions'
import type { JiraWebhookRoute, JiraWebhookRouteHandleParameters } from '../jira-webhook-route'
import {
  JiraIssueWebhookPayloadSchema,
  JiraWebhookDecisionKind,
  JiraWebhookIgnoreReason,
  type JiraWebhookDecision,
} from '../../models'
/**
 * Jira `webhookEvent` values that enqueue triage.
 */
const JiraTriageWebhookEvents = ['jira:issue_assigned', 'jira:issue_created', 'jira:issue_updated'] as const

/**
 * Jira webhook route that decides whether an issue delivery should enqueue a
 * triage workflow run.
 *
 * Preconditions: the dispatcher has already verified the webhook signature and
 * confirmed the body `webhookEvent` is in {@link jiraTriageRoute.events} when
 * present. This handler does not re-check HMAC or the event allowlist.
 *
 * Returns {@link JiraWebhookDecisionKind.ENQUEUE} when:
 * - the body parses as an issue webhook payload
 * - the assignee gate passes (or no automation account is configured)
 *
 * Otherwise returns {@link JiraWebhookDecisionKind.IGNORE} with a
 * {@link JiraWebhookIgnoreReason}:
 * - `invalid_jira_payload` — body failed schema validation
 * - `assignee_gate` — assignee does not match the automation account
 *
 * On enqueue, `definitionKey` is {@link jiraTriageFlow},
 * `activeKey` is `jira.triage:<issueKey>`, and `triggerIdentifier` is
 * `jira:issue:<issueKey>:<updated>`.
 */
export const jiraTriageRoute: JiraWebhookRoute = {
  // MARK: - Properties

  /**
   * Issue create / update / assign deliveries are handled by this route.
   */
  events: [...JiraTriageWebhookEvents],

  /**
   * Stable id for registry lookup and logs.
   */
  name: 'jira-triage',

  // MARK: - JiraWebhookRoute

  /**
   * Decides whether one allowlisted issue delivery should enqueue triage.
   *
   * @param parameters - Connection id, optional assignee gate, and parsed body.
   * @returns A {@link JiraWebhookDecision} to enqueue or ignore.
   */
  handle(parameters: JiraWebhookRouteHandleParameters): JiraWebhookDecision {
    const content = JiraIssueWebhookPayloadSchema.safeParse(parameters.body)

    if (!content.success) {
      return {
        kind: JiraWebhookDecisionKind.IGNORE,
        reason: JiraWebhookIgnoreReason.INVALID_JIRA_PAYLOAD,
      }
    }

    const issueKey = content.data.issue.key
    const assigneeAccountId = content.data.issue.fields.assignee?.accountId
    const automationAssigneeAccountId = parameters.automationAssigneeAccountId

    if (automationAssigneeAccountId) {
      if (!assigneeAccountId || assigneeAccountId !== automationAssigneeAccountId) {
        return {
          kind: JiraWebhookDecisionKind.IGNORE,
          reason: JiraWebhookIgnoreReason.ASSIGNEE_GATE,
        }
      }
    }

    const updated = content.data.issue.fields.updated ?? 'unknown'
    const payload: JiraTriageJobPayload = {
      connectionId: parameters.connectionId,
      issueKey,
      ...(automationAssigneeAccountId ? { assigneeFilter: { accountId: automationAssigneeAccountId } } : {}),
      options: {
        attemptFix: true,
        classifyOnly: false,
        dryRunTests: false,
      },
    }

    return {
      kind: JiraWebhookDecisionKind.ENQUEUE,
      activeKey: `jira.triage:${issueKey}`,
      definitionKey: jiraTriageFlow.key,
      payload,
      triggerIdentifier: `jira:issue:${issueKey}:${updated}`,
    }
  },
}
