// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { Prisma } from '@prisma/client'
import { JiraTriageFlowDefinitionKey } from '@/workflow/definitions/keys'
import { WorkflowOrchestrator } from '@/workflow/orchestrator'
import { WorkflowRunCreateError } from '@/workflow/error/error'
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
  let start: jest.Mock

  beforeEach(async () => {
    start = jest.fn().mockResolvedValue({ job: { id: 'job-1' }, run: { id: 'run-1' } })

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
        definitionKey: JiraTriageFlowDefinitionKey,
        triggerIdentifier: 'jira:issue:JC-7:2026-08-01T12:00:00.000+0000',
      }),
    )
  })

  it('returns already_enqueued on unique key collisions', async () => {
    const rawBody = Buffer.from(JSON.stringify(body), 'utf8')
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique', {
      clientVersion: 'test',
      code: 'P2002',
    })

    start.mockRejectedValue(
      new WorkflowRunCreateError('Failed to create workflow run', {
        cause: prismaError,
      }),
    )

    await expect(
      service.handle({
        body,
        rawBody,
        signatureHeader: signJiraWebhookPayload(rawBody, secret),
      }),
    ).resolves.toEqual({
      action: 'already_enqueued',
      ok: true,
      reason: 'jira:issue:JC-7:2026-08-01T12:00:00.000+0000',
    })
  })
})
