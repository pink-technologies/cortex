// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraTriageJobPayload } from '@cortex/protocol'
import {
  JiraIssueWebhookPayloadSchema,
  type JiraTriageEnqueueMapping,
} from '../models'

/**
 * Maps a Jira webhook body into a `jira.triage` enqueue request.
 *
 * Enqueues when the issue is assigned to the configured automation account
 * (or when no automation account id is configured — Node still gates).
 *
 * @param body - Parsed JSON body from Jira.
 * @param connectionId - Node-local Jira connection id.
 * @param automationAssigneeAccountId - Optional assignee gate at ingress.
 * @returns Enqueue mapping or an ignore reason.
 */
export function mapJiraWebhookToTriageEnqueue(
  body: unknown,
  connectionId: string,
  automationAssigneeAccountId: string | undefined,
): JiraTriageEnqueueMapping {
  const parsed = JiraIssueWebhookPayloadSchema.safeParse(body)

  if (!parsed.success) {
    return { kind: 'ignore', reason: 'invalid_jira_payload' }
  }

  const event = parsed.data.webhookEvent
  if (
    event &&
    event !== 'jira:issue_updated' &&
    event !== 'jira:issue_created' &&
    event !== 'jira:issue_assigned'
  ) {
    return { kind: 'ignore', reason: `unsupported_event:${event}` }
  }

  const issueKey = parsed.data.issue.key
  const assigneeAccountId = parsed.data.issue.fields.assignee?.accountId

  if (automationAssigneeAccountId) {
    if (!assigneeAccountId || assigneeAccountId !== automationAssigneeAccountId) {
      return { kind: 'ignore', reason: 'assignee_gate' }
    }
  }

  const updated = parsed.data.issue.fields.updated ?? 'unknown'

  const payload: JiraTriageJobPayload = {
    connectionId,
    issueKey,
    options: {
      attemptFix: true,
      dryRunTests: false,
    },
    ...(automationAssigneeAccountId
      ? { assigneeFilter: { accountId: automationAssigneeAccountId } }
      : {}),
  }

  return {
    kind: 'enqueue',
    payload,
    triggerIdentifier: `jira:issue:${issueKey}:${updated}`,
  }
}
