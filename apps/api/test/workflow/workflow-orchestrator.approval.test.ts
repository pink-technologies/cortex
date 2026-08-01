// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { randomUUID } from 'node:crypto'
import { ConfigModule } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { Database, DatabaseModule } from '../../src/infraestructure/database'
import { ExecutionJobStatus } from '../../src/execution/datatypes/execution-job-status'
import { ExecutionJobService } from '../../src/execution/execution-job.service'
import { ExecutionModule } from '../../src/execution/execution.module'
import {
  IssueImplementFlowDefinitionKey,
  WorkflowApprovalError,
  WorkflowModule,
  WorkflowOrchestrator,
  WorkflowRunStatus,
  WorkflowStepStatus,
} from '../../src/workflow'

describe('WorkflowOrchestrator approval', () => {
  let database: Database
  let executionJobService: ExecutionJobService
  let orchestrator: WorkflowOrchestrator

  const createdRunIds: string[] = []

  beforeAll(async () => {
    process.env.NODE_ENV ??= 'development'

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: `env/.env.${process.env.NODE_ENV ?? 'development'}`,
          isGlobal: true,
        }),
        DatabaseModule,
        ExecutionModule,
        WorkflowModule,
      ],
    }).compile()

    await module.init()

    database = module.get(Database)
    executionJobService = module.get(ExecutionJobService)
    orchestrator = module.get(WorkflowOrchestrator)
  })

  afterEach(async () => {
    if (createdRunIds.length === 0) {
      return
    }

    const runIds = [...createdRunIds]

    await database.executionJob.deleteMany({
      where: {
        runId: {
          in: runIds,
        },
      },
    })
    await database.workflowRun.deleteMany({
      where: {
        id: {
          in: runIds,
        },
      },
    })
    createdRunIds.length = 0
  })

  afterAll(async () => {
    await database.$disconnect()
  })

  async function completeJob(jobId: string): Promise<void> {
    const claimToken = randomUUID()
    const nodeId = `node-${randomUUID()}`

    await database.executionJob.update({
      where: {
        id: jobId,
      },
      data: {
        claimToken,
        claimedByNodeId: nodeId,
        startedAt: new Date(),
        status: ExecutionJobStatus.RUNNING,
      },
    })

    await executionJobService.complete(jobId, { claimToken, nodeId })
  }

  /**
   * Drives an issue-implement run through its three JOB steps so the run
   * parks on the trailing approval step.
   */
  async function startRunParkedOnApproval(input: unknown): Promise<string> {
    const { job, run } = await orchestrator.start({
      definitionKey: IssueImplementFlowDefinitionKey,
      input,
      triggerIdentifier: `workflow-approval:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    let currentJobId: string | undefined = job.id

    while (currentJobId) {
      await completeJob(currentJobId)

      const nextJob = await database.executionJob.findFirst({
        where: {
          runId: run.id,
          status: ExecutionJobStatus.QUEUED,
        },
      })

      currentJobId = nextJob?.id
    }

    return run.id
  }

  it('parks the run awaiting approval after the last JOB step', async () => {
    const runId = await startRunParkedOnApproval({ issueKey: 'JC-20' })

    const parked = await database.workflowRun.findUnique({
      where: {
        id: runId,
      },
      include: {
        steps: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    })

    expect(parked?.status).toBe(WorkflowRunStatus.AWAITING_APPROVAL)
    expect(parked?.steps[3]?.status).toBe(WorkflowStepStatus.AWAITING_APPROVAL)
    expect(parked?.steps[3]?.startedAt).toBeInstanceOf(Date)
  })

  it('approve completes the approval step and the run', async () => {
    const input = { issueKey: 'JC-21' }
    const runId = await startRunParkedOnApproval(input)

    const approved = await orchestrator.approve(runId)

    expect(approved?.status).toBe(WorkflowRunStatus.COMPLETED)
    expect(approved?.completedAt).toBeInstanceOf(Date)
    expect(approved?.result).toEqual(input)
    expect(approved?.steps.map((step) => step.status)).toEqual([
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.COMPLETED,
    ])
  })

  it('reject fails the approval step and the run', async () => {
    const runId = await startRunParkedOnApproval({ issueKey: 'JC-22' })

    const rejected = await orchestrator.reject(runId)

    expect(rejected?.status).toBe(WorkflowRunStatus.FAILED)
    expect(rejected?.failedAt).toBeInstanceOf(Date)
    expect(rejected?.failure).toEqual({
      code: 'WORKFLOW_APPROVAL_REJECTED',
      message: 'Approval step approval was rejected',
    })
    expect(rejected?.steps[3]?.status).toBe(WorkflowStepStatus.FAILED)
  })

  it('throws when no step is awaiting approval', async () => {
    const { run } = await orchestrator.start({
      definitionKey: IssueImplementFlowDefinitionKey,
      input: { issueKey: 'JC-23' },
      triggerIdentifier: `workflow-approval-early:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    await expect(orchestrator.approve(run.id)).rejects.toThrow(WorkflowApprovalError)
    await expect(orchestrator.reject(run.id)).rejects.toThrow(WorkflowApprovalError)
  })

  it('rejects a second decision after approval is applied', async () => {
    const runId = await startRunParkedOnApproval({ issueKey: 'JC-24' })

    await orchestrator.approve(runId)

    await expect(orchestrator.approve(runId)).rejects.toMatchObject({
      code: 'WORKFLOW_APPROVAL_ERROR',
      runId,
    })
    await expect(orchestrator.reject(runId)).rejects.toMatchObject({
      code: 'WORKFLOW_APPROVAL_ERROR',
      runId,
    })
  })

  it('returns null for an unknown run', async () => {
    await expect(orchestrator.approve(randomUUID())).resolves.toBeNull()
    await expect(orchestrator.reject(randomUUID())).resolves.toBeNull()
  })
})
