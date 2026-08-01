// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { mapJiraWebhookToTriageEnqueue } from '../../../src/webhooks/jira'

describe('mapJiraWebhookToTriageEnqueue', () => {
  const body = {
    issue: {
      fields: {
        assignee: { accountId: 'automation' },
        updated: '2026-08-01T12:00:00.000+0000',
      },
      key: 'JC-42',
    },
    webhookEvent: 'jira:issue_updated',
  }

  it('enqueues when assignee matches automation account', () => {
    expect(mapJiraWebhookToTriageEnqueue(body, 'jira-main', 'automation')).toEqual({
      kind: 'enqueue',
      payload: {
        assigneeFilter: { accountId: 'automation' },
        connectionId: 'jira-main',
        issueKey: 'JC-42',
        options: {
          attemptFix: true,
          dryRunTests: false,
        },
      },
      triggerIdentifier: 'jira:issue:JC-42:2026-08-01T12:00:00.000+0000',
    })
  })

  it('ignores when assignee gate fails', () => {
    expect(mapJiraWebhookToTriageEnqueue(body, 'jira-main', 'someone-else')).toEqual({
      kind: 'ignore',
      reason: 'assignee_gate',
    })
  })
})
