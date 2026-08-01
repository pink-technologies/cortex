// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { JiraTriageJobKind } from '@cortex/protocol'
import { ExecutionJobService } from '../../../src/execution/execution-job.service'
import {
  JiraWebhookService,
  signJiraWebhookPayload,
} from '../../../src/webhooks/jira'

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
  let create: jest.Mock

  beforeEach(async () => {
    create = jest.fn().mockResolvedValue({ id: 'job-1' })

    const module = await Test.createTestingModule({
      providers: [
        JiraWebhookService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'JIRA_WEBHOOK_SECRET') return secret
              if (key === 'JIRA_DEFAULT_CONNECTION_ID') return 'jira-main'
              if (key === 'JIRA_AUTOMATION_ASSIGNEE_ACCOUNT_ID') return 'automation'
              return undefined
            },
          },
        },
        {
          provide: ExecutionJobService,
          useValue: { create },
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
        signatureHeader: 'sha256=deadbeef',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('enqueues jira.triage jobs', async () => {
    const rawBody = Buffer.from(JSON.stringify(body), 'utf8')

    await expect(
      service.handle({
        body,
        rawBody,
        signatureHeader: signJiraWebhookPayload(rawBody, secret),
      }),
    ).resolves.toEqual({
      action: 'enqueued',
      jobId: 'job-1',
      ok: true,
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        activeKey: 'jira.triage:JC-7',
        kind: JiraTriageJobKind,
        triggerIdentifier: 'jira:issue:JC-7:2026-08-01T12:00:00.000+0000',
      }),
    )
  })
})
