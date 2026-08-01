// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Test } from '@nestjs/testing'
import { JiraTriageJobKind } from '@cortex/protocol'
import { ExecutionJobController } from '../../../src/execution/controller/execution-job.controller'
import { ExecutionJobService } from '../../../src/execution/execution-job.service'
import { ExecutionJobStatus } from '../../../src/execution/datatypes/execution-job-status'

describe('ExecutionJobController jira triages', () => {
  let controller: ExecutionJobController
  let create: jest.Mock

  beforeEach(async () => {
    create = jest.fn()

    const module = await Test.createTestingModule({
      controllers: [ExecutionJobController],
      providers: [
        {
          provide: ExecutionJobService,
          useValue: {
            create,
            findById: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get(ExecutionJobController)
  })

  it('enqueues a jira.triage job', async () => {
    const now = new Date('2026-08-01T12:00:00.000Z')

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
      id: 'job-jira-1',
      kind: JiraTriageJobKind,
      lastHeartbeatAt: null,
      leaseExpiresAt: null,
      maxAttempts: 1,
      payload: {
        connectionId: 'jira-main',
        issueKey: 'JC-1',
        options: { attemptFix: true, dryRunTests: false },
      },
      payloadVersion: 1,
      policy: {},
      priority: 0,
      requirements: { allOf: [] },
      result: null,
      sourceIdentifier: null,
      sourceType: null,
      status: ExecutionJobStatus.QUEUED,
      updatedAt: now,
    })

    const response = await controller.createJiraTriage({
      payload: {
        connectionId: 'jira-main',
        issueKey: 'JC-1',
        options: { attemptFix: true, dryRunTests: false },
      },
      priority: 0,
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: JiraTriageJobKind,
        payload: expect.objectContaining({ issueKey: 'JC-1' }),
      }),
    )
    expect(response.id).toBe('job-jira-1')
    expect(response.kind).toBe(JiraTriageJobKind)
  })
})
