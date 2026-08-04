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
  JiraTriageFlowDefinitionKey,
  WorkflowCancelError,
  WorkflowModule,
  WorkflowOrchestrator,
  WorkflowRunStatus,
  WorkflowStepStatus,
} from '../../src/workflow'

describe('WorkflowOrchestrator cancel', () => {
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

  it('cancels a running run, its steps, and its queued job, releasing the activeKey', async () => {
    const activeKey = `workflow-cancel-release:${randomUUID()}`

    const { job, run } = await orchestrator.start({
      activeKey,
      definitionKey: JiraTriageFlowDefinitionKey,
      input: { issueKey: 'JC-60' },
    })
    createdRunIds.push(run.id)

    const cancelled = await orchestrator.cancel(run.id)

    expect(cancelled?.status).toBe(WorkflowRunStatus.CANCELLED)
    expect(cancelled?.activeKey).toBeNull()
    expect(cancelled?.steps[0]?.status).toBe(WorkflowStepStatus.CANCELLED)

    const cancelledJob = await database.executionJob.findUnique({
      where: {
        id: job.id,
      },
    })

    expect(cancelledJob?.status).toBe(ExecutionJobStatus.CANCELLED)
    expect(cancelledJob?.cancellationRequestedAt).toBeInstanceOf(Date)

    const successor = await orchestrator.start({
      activeKey,
      definitionKey: JiraTriageFlowDefinitionKey,
      input: { issueKey: 'JC-60' },
    })
    createdRunIds.push(successor.run.id)

    expect(successor.run.status).toBe(WorkflowRunStatus.RUNNING)
  })

  it('flags a running job and neutralizes its late completion', async () => {
    const { job, run } = await orchestrator.start({
      definitionKey: JiraTriageFlowDefinitionKey,
      input: { issueKey: 'JC-61' },
      triggerIdentifier: `workflow-cancel-late:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    const claim = await markRunning(job.id)

    const cancelled = await orchestrator.cancel(run.id)

    expect(cancelled?.status).toBe(WorkflowRunStatus.CANCELLED)

    const flaggedJob = await database.executionJob.findUnique({
      where: {
        id: job.id,
      },
    })

    expect(flaggedJob?.status).toBe(ExecutionJobStatus.RUNNING)
    expect(flaggedJob?.cancellationRequestedAt).toBeInstanceOf(Date)

    // The node has not observed the request yet and reports completion.
    await expect(
      executionJobService.complete(job.id, {
        claimToken: claim.claimToken,
        nodeId: claim.nodeId,
        result: {
          classification: {
            automationEligible: false,
            class: 'bug',
            confidence: 0.9,
            rationale: 'Reported defect with clear reproduction steps.',
          },
          escalation: {
            action: 'none',
            reason: 'Run was cancelled before escalation.',
          },
          issueKey: 'JC-61',
        },
      }),
    ).resolves.toBe(true)

    const afterLateCompletion = await database.workflowRun.findUnique({
      where: {
        id: run.id,
      },
      include: {
        steps: true,
      },
    })

    expect(afterLateCompletion?.status).toBe(WorkflowRunStatus.CANCELLED)
    expect(afterLateCompletion?.steps[0]?.status).toBe(WorkflowStepStatus.CANCELLED)
  })

  it('throws WorkflowCancelError for a terminal run and leaves it untouched', async () => {
    const { job, run } = await orchestrator.start({
      definitionKey: JiraTriageFlowDefinitionKey,
      input: { issueKey: 'JC-62' },
      triggerIdentifier: `workflow-cancel-terminal:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    const claim = await markRunning(job.id)
    await executionJobService.complete(job.id, {
      claimToken: claim.claimToken,
      nodeId: claim.nodeId,
    })

    await expect(orchestrator.cancel(run.id)).rejects.toThrow(WorkflowCancelError)

    const untouched = await database.workflowRun.findUnique({
      where: {
        id: run.id,
      },
    })

    expect(untouched?.status).toBe(WorkflowRunStatus.COMPLETED)
  })

  it('returns null for a missing run', async () => {
    await expect(orchestrator.cancel(randomUUID())).resolves.toBeNull()
  })
})
