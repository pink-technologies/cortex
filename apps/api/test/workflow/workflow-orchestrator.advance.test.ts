// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { randomUUID } from 'node:crypto'
import { ConfigModule } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import {
  AgentExecuteJobKind,
  JiraTriageJobKind,
  RepositoryReviewJobKind,
} from '@cortex/protocol'
import { Database, DatabaseModule } from '../../src/infraestructure/database'
import { ExecutionJobStatus } from '../../src/execution/datatypes/execution-job-status'
import { ExecutionJobService } from '../../src/execution/execution-job.service'
import { ExecutionModule } from '../../src/execution/execution.module'
import {
  IssueImplementFlowDefinitionKey,
  JiraTriageFlowDefinitionKey,
  WorkflowModule,
  WorkflowOrchestrator,
  WorkflowRunStatus,
  WorkflowStepStatus,
} from '../../src/workflow'

describe('WorkflowOrchestrator advance', () => {
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

  async function markRunning(jobId: string): Promise<{ claimToken: string; nodeId: string }> {
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

    return { claimToken, nodeId }
  }

  it('completes a one-step flow when its job completes', async () => {
    const { job, run } = await orchestrator.start({
      definitionKey: JiraTriageFlowDefinitionKey,
      input: { issueKey: 'JC-10' },
      triggerIdentifier: `workflow-advance-one:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    const claim = await markRunning(job.id)
    const completed = await executionJobService.complete(job.id, {
      claimToken: claim.claimToken,
      nodeId: claim.nodeId,
    })

    expect(completed).toBe(true)

    const updated = await database.workflowRun.findUnique({
      where: {
        id: run.id,
      },
      include: {
        steps: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    })

    expect(updated?.status).toBe(WorkflowRunStatus.COMPLETED)
    expect(updated?.completedAt).toBeInstanceOf(Date)
    expect(updated?.steps[0]?.status).toBe(WorkflowStepStatus.COMPLETED)
  })

  it('advances JOB→JOB and parks before APPROVAL', async () => {
    const { job, run } = await orchestrator.start({
      definitionKey: IssueImplementFlowDefinitionKey,
      input: { issueKey: 'JC-11' },
      triggerIdentifier: `workflow-advance-multi:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    expect(job.kind).toBe(JiraTriageJobKind)

    const firstClaim = await markRunning(job.id)
    await executionJobService.complete(job.id, {
      claimToken: firstClaim.claimToken,
      nodeId: firstClaim.nodeId,
    })

    const afterFirst = await database.workflowRun.findUnique({
      where: {
        id: run.id,
      },
      include: {
        steps: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    })

    expect(afterFirst?.status).toBe(WorkflowRunStatus.RUNNING)
    expect(afterFirst?.steps.map((step) => step.status)).toEqual([
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.QUEUED,
      WorkflowStepStatus.PENDING,
      WorkflowStepStatus.PENDING,
    ])

    const secondJob = await database.executionJob.findFirst({
      where: {
        runId: run.id,
        stepId: afterFirst?.steps[1]?.id,
      },
    })

    expect(secondJob).not.toBeNull()
    expect(secondJob?.kind).toBe(AgentExecuteJobKind)
    expect(secondJob?.status).toBe(ExecutionJobStatus.QUEUED)
    expect(secondJob?.payload).toEqual({ issueKey: 'JC-11' })

    const secondClaim = await markRunning(secondJob!.id)
    await executionJobService.complete(secondJob!.id, {
      claimToken: secondClaim.claimToken,
      nodeId: secondClaim.nodeId,
    })

    const thirdJob = await database.executionJob.findFirst({
      where: {
        runId: run.id,
        kind: RepositoryReviewJobKind,
      },
    })
    expect(thirdJob).not.toBeNull()

    const thirdClaim = await markRunning(thirdJob!.id)
    await executionJobService.complete(thirdJob!.id, {
      claimToken: thirdClaim.claimToken,
      nodeId: thirdClaim.nodeId,
    })

    const parked = await database.workflowRun.findUnique({
      where: {
        id: run.id,
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
    expect(parked?.steps.map((step) => step.key)).toEqual([
      'triage',
      'implement',
      'review',
      'approval',
    ])
    expect(parked?.steps.map((step) => step.status)).toEqual([
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.AWAITING_APPROVAL,
    ])
    expect(parked?.steps[3]?.startedAt).toBeInstanceOf(Date)
  })

  it('fails the run when a linked job fails', async () => {
    const { job, run } = await orchestrator.start({
      definitionKey: JiraTriageFlowDefinitionKey,
      input: { issueKey: 'JC-12' },
      triggerIdentifier: `workflow-advance-fail:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    const claim = await markRunning(job.id)
    const failed = await executionJobService.fail(job.id, {
      claimToken: claim.claimToken,
      failure: {
        code: 'TRIAGE_FAILED',
        message: 'classifier unavailable',
      },
      nodeId: claim.nodeId,
    })

    expect(failed).toBe(true)

    const updated = await database.workflowRun.findUnique({
      where: {
        id: run.id,
      },
      include: {
        steps: true,
      },
    })

    expect(updated?.status).toBe(WorkflowRunStatus.FAILED)
    expect(updated?.failedAt).toBeInstanceOf(Date)
    expect(updated?.failure).toEqual({
      code: 'TRIAGE_FAILED',
      message: 'classifier unavailable',
    })
    expect(updated?.steps[0]?.status).toBe(WorkflowStepStatus.FAILED)
  })

  it('does not advance standalone jobs without a run', async () => {
    const job = await executionJobService.create({
      kind: JiraTriageJobKind,
      payload: { issueKey: 'JC-13' },
      payloadVersion: 1,
      policy: {},
      priority: 0,
      requirements: {
        allOf: [],
      },
    })

    const claim = await markRunning(job.id)
    const completed = await executionJobService.complete(job.id, {
      claimToken: claim.claimToken,
      nodeId: claim.nodeId,
    })

    expect(completed).toBe(true)

    await database.executionJob.delete({
      where: {
        id: job.id,
      },
    })
  })
})
