// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Test } from '@nestjs/testing'
import { NodesService } from '@/nodes/nodes.service'
import { EXECUTION_JOB_REPOSITORY } from '@/execution/execution-job-repository'
import { ExecutionJobService } from '@/execution/execution-job.service'
import { WORKFLOW_JOB_LIFECYCLE, type WorkflowJobLifecycle } from '@/execution/ports'
import { ExecutionJob } from '@/execution/models/execution-job'
import { ExecutionJobStatus } from '@/execution/datatypes/execution-job-status'

describe('ExecutionJobService lifecycle port', () => {
  it('fails to resolve when WORKFLOW_JOB_LIFECYCLE is not provided', async () => {
    await expect(
      Test.createTestingModule({
        providers: [
          ExecutionJobService,
          {
            provide: EXECUTION_JOB_REPOSITORY,
            useValue: {},
          },
          {
            provide: NodesService,
            useValue: {},
          },
        ],
      }).compile(),
    ).rejects.toThrow(/WORKFLOW_JOB_LIFECYCLE|Nest can't resolve dependencies/i)
  })

  it('notifies the required lifecycle port after claim, complete, and fail', async () => {
    const lifecycle: jest.Mocked<WorkflowJobLifecycle> = {
      onJobClaimed: jest.fn().mockResolvedValue(undefined),
      onJobCompleted: jest.fn().mockResolvedValue(undefined),
      onJobFailed: jest.fn().mockResolvedValue(undefined),
    }

    const linkedJob = {
      id: 'job-1',
      kind: 'system.test',
      runId: 'run-1',
      stepId: 'step-1',
      status: ExecutionJobStatus.RUNNING,
    } as ExecutionJob

    const repository = {
      claimNextAvailable: jest.fn().mockResolvedValue(linkedJob),
      complete: jest.fn().mockResolvedValue(true),
      fail: jest.fn().mockResolvedValue(true),
      findById: jest.fn().mockResolvedValue(linkedJob),
    }

    const nodesService = {
      resolveForExecution: jest.fn().mockResolvedValue({
        id: 'node-1',
        capabilities: [],
        labels: [],
        supportedKinds: ['system.test'],
      }),
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExecutionJobService,
        {
          provide: EXECUTION_JOB_REPOSITORY,
          useValue: repository,
        },
        {
          provide: NodesService,
          useValue: nodesService,
        },
        {
          provide: WORKFLOW_JOB_LIFECYCLE,
          useValue: lifecycle,
        },
      ],
    }).compile()

    const service = moduleRef.get(ExecutionJobService)

    await service.claimNextAvailable('node-1')
    await service.complete('job-1', {
      claimToken: '00000000-0000-4000-8000-000000000001',
      nodeId: 'node-1',
      result: { ok: true },
    })
    await service.fail('job-1', {
      claimToken: '00000000-0000-4000-8000-000000000001',
      failure: {
        code: 'FAILED',
        message: 'boom',
      },
      nodeId: 'node-1',
    })

    expect(lifecycle.onJobClaimed).toHaveBeenCalledWith('job-1')
    expect(lifecycle.onJobCompleted).toHaveBeenCalledWith('job-1')
    expect(lifecycle.onJobFailed).toHaveBeenCalledWith('job-1')
  })
})
