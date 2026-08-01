// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Test, type TestingModule } from '@nestjs/testing'
import {
  AgentExecuteJobKind,
  RepositoryReviewJobKind,
} from '@cortex/protocol'
import { ExecutionJobController } from '../../../src/execution/controller/execution-job.controller'
import { ExecutionJobService } from '../../../src/execution/execution-job.service'
import { ExecutionJobStatus } from '../../../src/execution/datatypes/execution-job-status'

describe('ExecutionJobController repository reviews', () => {
  let controller: ExecutionJobController
  let create: jest.Mock
  let findById: jest.Mock

  beforeEach(async () => {
    create = jest.fn()
    findById = jest.fn()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecutionJobController],
      providers: [
        {
          provide: ExecutionJobService,
          useValue: {
            create,
            findById,
          },
        },
      ],
    }).compile()

    controller = module.get(ExecutionJobController)
  })

  it('enqueues a repository.review job', async () => {
    const now = new Date('2026-07-31T12:00:00.000Z')

    create.mockResolvedValue({
      activeKey: null,
      attemptCount: 0,
      claimedAt: null,
      claimedByNodeId: null,
      claimToken: null,
      completedAt: null,
      createdAt: now,
      failedAt: null,
      failure: null,
      id: 'job-1',
      kind: RepositoryReviewJobKind,
      lastHeartbeatAt: null,
      leaseExpiresAt: null,
      maxAttempts: 1,
      payload: {
        change: { headRef: 'feature' },
        connectionId: 'github-main',
        repository: {
          cloneUrl: 'https://github.com/pink-tech/cortex.git',
          name: 'cortex',
          owner: 'pink-tech',
        },
        reviewMode: 'diff',
      },
      payloadVersion: 1,
      policy: {},
      priority: 1,
      requirements: { allOf: [] },
      result: null,
      sourceIdentifier: null,
      sourceType: null,
      status: ExecutionJobStatus.QUEUED,
      updatedAt: now,
    })

    const response = await controller.createRepositoryReview({
      payload: {
        change: { headRef: 'feature' },
        connectionId: 'github-main',
        repository: {
          cloneUrl: 'https://github.com/pink-tech/cortex.git',
          name: 'cortex',
          owner: 'pink-tech',
        },
        reviewMode: 'diff',
      },
      priority: 1,
    })

    expect(create).toHaveBeenCalledWith({
      kind: RepositoryReviewJobKind,
      payload: expect.objectContaining({
        connectionId: 'github-main',
      }),
      payloadVersion: 1,
      policy: {},
      priority: 1,
      requirements: {
        allOf: [],
      },
    })
    expect(response.kind).toBe(RepositoryReviewJobKind)
    expect(response.id).toBe('job-1')
  })

  it('returns a completed repository.review result from findById', async () => {
    const now = new Date('2026-07-31T12:00:00.000Z')
    const result = {
      findings: [],
      reviewMode: 'diff' as const,
      summary: 'Clean.',
    }

    findById.mockResolvedValue({
      activeKey: null,
      attemptCount: 1,
      claimedAt: now,
      claimedByNodeId: null,
      claimToken: null,
      completedAt: now,
      createdAt: now,
      failedAt: null,
      failure: null,
      id: 'job-1',
      kind: RepositoryReviewJobKind,
      lastHeartbeatAt: null,
      leaseExpiresAt: null,
      maxAttempts: 1,
      payload: {},
      payloadVersion: 1,
      policy: {},
      priority: 0,
      requirements: { allOf: [] },
      result,
      sourceIdentifier: null,
      sourceType: null,
      status: ExecutionJobStatus.COMPLETED,
      updatedAt: now,
    })

    const response = await controller.findById('job-1')

    expect(response).toEqual(
      expect.objectContaining({
        id: 'job-1',
        kind: RepositoryReviewJobKind,
        result,
        status: ExecutionJobStatus.COMPLETED,
      }),
    )
    expect(response.kind).not.toBe(AgentExecuteJobKind)
  })
})
