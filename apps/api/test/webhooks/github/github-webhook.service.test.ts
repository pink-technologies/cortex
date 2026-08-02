// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { Prisma } from '@prisma/client'
import { RepositoryReviewJobKind } from '@cortex/protocol'
import { RepositoryReviewFlowDefinitionKey } from '@/workflow/definitions/keys'
import { WorkflowOrchestrator } from '@/workflow/orchestrator'
import { WorkflowRunCreateError } from '@/workflow/error/error'
import { ExecutionJobStatus } from '../../../src/execution/datatypes/execution-job-status'
import {
  GitHubWebhookService,
  signGitHubWebhookPayload,
} from '../../../src/webhooks/github'

describe('GitHubWebhookService', () => {
  const secret = 'webhook-secret'
  const pullRequestBody = {
    action: 'opened',
    pull_request: {
      base: { ref: 'main' },
      draft: false,
      head: { ref: 'feature/webhook', sha: 'abc123' },
      number: 42,
    },
    repository: {
      clone_url: 'https://github.com/pink-tech/cortex.git',
      name: 'cortex',
      owner: { login: 'pink-tech' },
    },
  }

  let service: GitHubWebhookService
  let start: jest.Mock

  beforeEach(async () => {
    start = jest.fn()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitHubWebhookService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'GITHUB_WEBHOOK_SECRET') {
                return secret
              }

              if (key === 'GITHUB_DEFAULT_CONNECTION_ID') {
                return 'github-main'
              }

              if (key === 'GITHUB_REVIEW_INSTRUCTIONS') {
                return 'Focus on bugs.'
              }

              return undefined
            },
          },
        },
        {
          provide: WorkflowOrchestrator,
          useValue: {
            start,
          },
        },
      ],
    }).compile()

    service = module.get(GitHubWebhookService)
  })

  it('rejects invalid signatures', async () => {
    const rawBody = Buffer.from(JSON.stringify(pullRequestBody), 'utf8')

    await expect(
      service.handle({
        body: pullRequestBody,
        deliveryId: 'delivery-1',
        event: 'pull_request',
        rawBody,
        signatureHeader: 'sha256=invalid',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('starts a repository.review.flow run for pull_request opened', async () => {
    const rawBody = Buffer.from(JSON.stringify(pullRequestBody), 'utf8')
    const now = new Date('2026-07-31T12:00:00.000Z')

    start.mockResolvedValue({
      job: {
        id: 'job-1',
        kind: RepositoryReviewJobKind,
        status: ExecutionJobStatus.QUEUED,
        createdAt: now,
        updatedAt: now,
      },
      run: {
        id: 'run-1',
      },
    })

    const result = await service.handle({
      body: pullRequestBody,
      deliveryId: 'delivery-1',
      event: 'pull_request',
      rawBody,
      signatureHeader: signGitHubWebhookPayload(rawBody, secret),
    })

    expect(result).toEqual({
      action: 'enqueued',
      jobId: 'job-1',
      ok: true,
      runId: 'run-1',
    })

    expect(start).toHaveBeenCalledWith({
      definitionKey: RepositoryReviewFlowDefinitionKey,
      input: expect.objectContaining({
        connectionId: 'github-main',
        instructions: 'Focus on bugs.',
        reviewMode: 'diff',
      }),
      source: {
        identifier: 'delivery-1',
        type: 'webhook',
      },
      triggerIdentifier: 'github:pull_request:pink-tech/cortex:42:abc123',
    })
  })

  it('returns already_enqueued on unique triggerIdentifier collisions', async () => {
    const rawBody = Buffer.from(JSON.stringify(pullRequestBody), 'utf8')
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique', {
      clientVersion: 'test',
      code: 'P2002',
    })

    start.mockRejectedValue(
      new WorkflowRunCreateError('Failed to create workflow run', {
        cause: prismaError,
      }),
    )

    const result = await service.handle({
      body: pullRequestBody,
      deliveryId: 'delivery-1',
      event: 'pull_request',
      rawBody,
      signatureHeader: signGitHubWebhookPayload(rawBody, secret),
    })

    expect(result).toEqual({
      action: 'already_enqueued',
      ok: true,
      reason: 'github:pull_request:pink-tech/cortex:42:abc123',
    })
  })

  it('rethrows non-unique start failures', async () => {
    const rawBody = Buffer.from(JSON.stringify(pullRequestBody), 'utf8')
    const failure = new WorkflowRunCreateError('Failed to create workflow run', {
      cause: new Error('connection reset'),
    })

    start.mockRejectedValue(failure)

    await expect(
      service.handle({
        body: pullRequestBody,
        deliveryId: 'delivery-1',
        event: 'pull_request',
        rawBody,
        signatureHeader: signGitHubWebhookPayload(rawBody, secret),
      }),
    ).rejects.toBe(failure)
  })

  it('acknowledges ping without starting a run', async () => {
    const rawBody = Buffer.from('{"zen":"Keep it logically awesome."}', 'utf8')

    const result = await service.handle({
      body: { zen: 'Keep it logically awesome.' },
      deliveryId: 'delivery-ping',
      event: 'ping',
      rawBody,
      signatureHeader: signGitHubWebhookPayload(rawBody, secret),
    })

    expect(result).toEqual({
      action: 'ignored',
      ok: true,
      reason: 'ping',
    })
    expect(start).not.toHaveBeenCalled()
  })
})
