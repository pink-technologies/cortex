// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { dispatchJiraWebhook } from '../../../src/webhooks/jira'

describe('dispatchJiraWebhook', () => {
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
    expect(
      dispatchJiraWebhook({
        automationAssigneeAccountId: 'automation',
        body,
        connectionId: 'jira-main',
        routeName: 'jira-triage',
      }),
    ).toEqual({
      kind: 'enqueue',
      activeKey: 'jira.triage:JC-42',
      definitionKey: 'jira.triage.flow',
      payload: {
        assigneeFilter: { accountId: 'automation' },
        connectionId: 'jira-main',
        issueKey: 'JC-42',
        options: {
          attemptFix: true,
          classifyOnly: false,
          dryRunTests: false,
        },
      },
      triggerIdentifier: 'jira:issue:JC-42:2026-08-01T12:00:00.000+0000',
    })
  })

  it('ignores when assignee gate fails', () => {
    expect(
      dispatchJiraWebhook({
        automationAssigneeAccountId: 'someone-else',
        body,
        connectionId: 'jira-main',
        routeName: 'jira-triage',
      }),
    ).toEqual({
      kind: 'ignore',
      reason: 'assignee_gate',
    })
  })

  it('ignores missing routes', () => {
    expect(
      dispatchJiraWebhook({
        body,
        connectionId: 'jira-main',
        routeName: undefined,
      }),
    ).toEqual({
      kind: 'ignore',
      reason: 'missing_route',
    })
  })

  it('ignores unsupported routes', () => {
    expect(
      dispatchJiraWebhook({
        body,
        connectionId: 'jira-main',
        routeName: 'unknown-route',
      }),
    ).toEqual({
      kind: 'ignore',
      reason: 'unsupported_route:unknown-route',
    })
  })

  it('ignores unsupported webhook events', () => {
    expect(
      dispatchJiraWebhook({
        body: { ...body, webhookEvent: 'comment_created' },
        connectionId: 'jira-main',
        routeName: 'jira-triage',
      }),
    ).toEqual({
      kind: 'ignore',
      reason: 'unsupported_event:comment_created',
    })
  })
})
