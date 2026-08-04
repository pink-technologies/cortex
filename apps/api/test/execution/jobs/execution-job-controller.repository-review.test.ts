// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Test, type TestingModule } from '@nestjs/testing'
import { AgentExecuteJobKind, RepositoryReviewJobKind } from '@cortex/protocol'
import { RepositoryReviewFlowDefinitionKey } from '@/workflow/definitions/keys'
import { WorkflowOrchestrator } from '@/workflow/orchestrator'
import { ExecutionJobController } from '../../../src/execution/controller/execution-job.controller'
import { ExecutionJobService } from '../../../src/execution/execution-job.service'
import { ExecutionJobStatus } from '../../../src/execution/datatypes/execution-job-status'

describe('ExecutionJobController repository reviews', () => {
  let controller: ExecutionJobController
  let start: jest.Mock
  let findById: jest.Mock

  beforeEach(async () => {
    start = jest.fn()
    findById = jest.fn()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecutionJobController],
      providers: [
        {
          provide: ExecutionJobService,
          useValue: {
            findById,
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

    controller = module.get(ExecutionJobController)
  })

  it('starts a repository.review.flow run and returns its first-step job', async () => {
    const now = new Date('2026-07-31T12:00:00.000Z')

    const firstStepJob = {
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
      runId: 'run-1',
      sourceIdentifier: null,
      sourceType: null,
      status: ExecutionJobStatus.QUEUED,
      updatedAt: now,
    }

    start.mockResolvedValue({ job: firstStepJob, run: { id: 'run-1' } })

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

    expect(start).toHaveBeenCalledWith({
      definitionKey: RepositoryReviewFlowDefinitionKey,
      input: expect.objectContaining({
        connectionId: 'github-main',
      }),
      priority: 1,
    })
    expect(response.kind).toBe(RepositoryReviewJobKind)
    expect(response.id).toBe('job-1')
    expect(response.runId).toBe('run-1')
  })

  it('returns a completed repository.review result from findById', async () => {
    const now = new Date('2026-07-31T12:00:00.000Z')
    const result = {
      findings: [],
      reviewMode: 'diff' as const,
      summary: 'Clean.',
    }

    findById.mockResolvedValue({
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
      runId: null,
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
