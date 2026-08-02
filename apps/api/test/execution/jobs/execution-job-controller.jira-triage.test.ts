// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Test } from '@nestjs/testing'
import { JiraTriageJobKind } from '@cortex/protocol'
import { JiraTriageFlowDefinitionKey } from '@/workflow/definitions/keys'
import { WorkflowOrchestrator } from '@/workflow/orchestrator'
import { ExecutionJobController } from '../../../src/execution/controller/execution-job.controller'
import { ExecutionJobService } from '../../../src/execution/execution-job.service'
import { ExecutionJobStatus } from '../../../src/execution/datatypes/execution-job-status'

describe('ExecutionJobController jira triages', () => {
  let controller: ExecutionJobController
  let start: jest.Mock

  beforeEach(async () => {
    start = jest.fn()

    const module = await Test.createTestingModule({
      controllers: [ExecutionJobController],
      providers: [
        {
          provide: ExecutionJobService,
          useValue: {
            findById: jest.fn(),
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

  it('starts a jira.triage.flow run and returns its first-step job', async () => {
    const now = new Date('2026-08-01T12:00:00.000Z')

    const firstStepJob = {
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
      runId: 'run-jira-1',
      sourceIdentifier: null,
      sourceType: null,
      status: ExecutionJobStatus.QUEUED,
      updatedAt: now,
    }

    start.mockResolvedValue({ job: firstStepJob, run: { id: 'run-jira-1' } })

    const response = await controller.createJiraTriage({
      payload: {
        connectionId: 'jira-main',
        issueKey: 'JC-1',
        options: { attemptFix: true, dryRunTests: false },
      },
      priority: 0,
    })

    expect(start).toHaveBeenCalledWith(
      expect.objectContaining({
        definitionKey: JiraTriageFlowDefinitionKey,
        input: expect.objectContaining({ issueKey: 'JC-1' }),
      }),
    )
    expect(response.id).toBe('job-jira-1')
    expect(response.kind).toBe(JiraTriageJobKind)
    expect(response.runId).toBe('run-jira-1')
  })
})
