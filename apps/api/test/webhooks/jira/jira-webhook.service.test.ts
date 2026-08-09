// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { UnauthorizedException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { API_CONFIGURATION } from '@/configuration'
import { jiraTriageFlow } from '@/workflow/definitions'
import { WorkflowOrchestrator } from '@/workflow/orchestrator'
import { JiraWebhookService, signJiraWebhookPayload } from '../../../src/webhooks/jira'
describe('JiraWebhookService', () => {
  const secret = 'jira-secret'
  const body = {
    issue: {
      fields: {
        assignee: { accountId: 'automation' },
        updated: '2026-08-01T12:00:00.000+0000',
      },
      key: 'JC-7',
    },
    webhookEvent: 'jira:issue_updated',
  }

  let service: JiraWebhookService
  let start: jest.Mock

  beforeEach(async () => {
    start = jest.fn().mockResolvedValue({
      created: true,
      job: { id: 'job-1' },
      run: { id: 'run-1' },
    })

    const module = await Test.createTestingModule({
      providers: [
        JiraWebhookService,
        {
          provide: API_CONFIGURATION,
          useValue: {
            databaseURL: 'postgresql://postgres:postgres@localhost:5432/cortex',
            jiraAutomationAssigneeAccountId: 'automation',
            jiraDefaultConnectionId: 'jira-main',
            jiraWebhookSecret: secret,
            port: 3000,
            redisURL: 'redis://localhost:6379',
          },
        },
        {
          provide: WorkflowOrchestrator,
          useValue: { start },
        },
      ],
    }).compile()

    service = module.get(JiraWebhookService)
  })

  it('rejects invalid signatures', async () => {
    const rawBody = Buffer.from(JSON.stringify(body), 'utf8')

    await expect(
      service.handle({
        body,
        rawBody,
        routeName: 'jira-triage',
        signatureHeader: 'sha256=deadbeef',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('starts jira.triage.flow runs', async () => {
    const rawBody = Buffer.from(JSON.stringify(body), 'utf8')

    await expect(
      service.handle({
        body,
        rawBody,
        routeName: 'jira-triage',
        signatureHeader: signJiraWebhookPayload(rawBody, secret),
      }),
    ).resolves.toEqual({
      action: 'enqueued',
      jobId: 'job-1',
      ok: true,
      runId: 'run-1',
    })

    expect(start).toHaveBeenCalledWith(
      expect.objectContaining({
        activeKey: 'jira.triage:JC-7',
        definitionKey: jiraTriageFlow.key,
        triggerIdentifier: 'jira:issue:JC-7:2026-08-01T12:00:00.000+0000',
      }),
    )
  })

  it('returns already_enqueued when start reuses an existing idempotency key', async () => {
    const rawBody = Buffer.from(JSON.stringify(body), 'utf8')

    start.mockResolvedValue({
      created: false,
      job: { id: 'job-1' },
      run: { id: 'run-1' },
    })

    await expect(
      service.handle({
        body,
        rawBody,
        routeName: 'jira-triage',
        signatureHeader: signJiraWebhookPayload(rawBody, secret),
      }),
    ).resolves.toEqual({
      action: 'already_enqueued',
      ok: true,
      reason: 'jira:issue:JC-7:2026-08-01T12:00:00.000+0000',
    })
  })
})
