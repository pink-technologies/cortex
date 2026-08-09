// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { randomUUID } from 'node:crypto'
import { ConfigModule } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { JiraTriageJobKind } from '@cortex/protocol'
import { Database, DatabaseModule } from '../../src/infraestructure/database'
import { ExecutionJobStatus } from '../../src/execution/datatypes/execution-job-status'
import { ExecutionJobService } from '../../src/execution/execution-job.service'
import { ExecutionModule } from '../../src/execution/execution.module'
import {
  WorkflowApprovalError,
  WorkflowDefinitionRegistry,
  WorkflowModule,
  WorkflowOrchestrator,
  WorkflowRunFailureCode,
  WorkflowRunStatus,
  WorkflowStepKind,
  WorkflowStepStatus,
  issueImplementFlow,
} from '../../src/workflow'
import {
  issueImplementFlowInput,
  issueImplementResultForKind,
  jiraTriageJobResult,
  repositoryReviewJobResult,
} from './issue-implement-fixtures'
/**
 * Test-only flow with consecutive approval gates for delayed-retry coverage.
 */
const DualApprovalFlowDefinitionKey = 'test.dual.approval.flow'

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

    const registry = module.get(WorkflowDefinitionRegistry)

    if (!registry.has(DualApprovalFlowDefinitionKey)) {
      registry.register({
        key: DualApprovalFlowDefinitionKey,
        version: 1,
        steps: [
          {
            key: 'work',
            kind: WorkflowStepKind.JOB,
            jobKind: JiraTriageJobKind,
            position: 0,
          },
          {
            key: 'approval-a',
            kind: WorkflowStepKind.APPROVAL,
            position: 1,
          },
          {
            key: 'approval-b',
            kind: WorkflowStepKind.APPROVAL,
            position: 2,
          },
        ],
      })
    }
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

  async function completeJob(jobId: string, result: unknown): Promise<void> {
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

    await executionJobService.complete(jobId, { claimToken, nodeId, result })
  }

  function approvalCommand(runId: string, stepId: string, decisionId?: string) {
    return {
      actorId: 'operator-1',
      decisionId: decisionId ?? randomUUID(),
      runId,
      stepId,
    }
  }

  /**
   * Drives an issue-implement run through its three JOB steps so the run
   * parks on the trailing approval step.
   */
  async function startRunParkedOnApproval(issueKey: string): Promise<{
    runId: string
    stepId: string
  }> {
    const { job, run } = await orchestrator.start({
      definitionKey: issueImplementFlow.key,
      input: issueImplementFlowInput(issueKey),
      triggerIdentifier: `workflow-approval:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    let currentJob: { id: string; kind: string } | undefined = job

    while (currentJob) {
      await completeJob(currentJob.id, issueImplementResultForKind(currentJob.kind, issueKey))

      const nextJob = await database.executionJob.findFirst({
        where: {
          runId: run.id,
          status: ExecutionJobStatus.QUEUED,
        },
      })

      currentJob = nextJob ?? undefined
    }

    const parked = await database.workflowRun.findUniqueOrThrow({
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

    return {
      runId: run.id,
      stepId: parked.steps[3]!.id,
    }
  }

  async function startDualApprovalParkedOnFirstGate(issueKey: string): Promise<{
    approvalAId: string
    approvalBId: string
    runId: string
  }> {
    const { job, run } = await orchestrator.start({
      definitionKey: DualApprovalFlowDefinitionKey,
      input: { issueKey },
      triggerIdentifier: `workflow-dual-approval:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    await completeJob(job.id, jiraTriageJobResult(issueKey))

    const parked = await database.workflowRun.findUniqueOrThrow({
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

    expect(parked.status).toBe(WorkflowRunStatus.AWAITING_APPROVAL)
    expect(parked.steps.map((step) => step.status)).toEqual([
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.AWAITING_APPROVAL,
      WorkflowStepStatus.PENDING,
    ])

    return {
      approvalAId: parked.steps[1]!.id,
      approvalBId: parked.steps[2]!.id,
      runId: run.id,
    }
  }

  it('parks the run awaiting approval after the last JOB step', async () => {
    const { runId } = await startRunParkedOnApproval('JC-20')

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
    const { runId, stepId } = await startRunParkedOnApproval('JC-21')

    const approved = await orchestrator.approve(approvalCommand(runId, stepId))

    expect(approved?.status).toBe(WorkflowRunStatus.COMPLETED)
    expect(approved?.completedAt).toBeInstanceOf(Date)
    expect(approved?.result).toEqual(repositoryReviewJobResult())
    expect(approved?.steps.map((step) => step.status)).toEqual([
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.COMPLETED,
    ])

    const decisions = await database.workflowApprovalDecision.findMany({
      where: {
        runId,
      },
    })
    expect(decisions).toHaveLength(1)
    expect(decisions[0]?.outcome).toBe('APPROVED')
    expect(decisions[0]?.actorId).toBe('operator-1')
  })

  it('reject fails the approval step and the run', async () => {
    const { runId, stepId } = await startRunParkedOnApproval('JC-22')

    const rejected = await orchestrator.reject({
      ...approvalCommand(runId, stepId),
      reason: 'Not ready',
    })

    expect(rejected?.status).toBe(WorkflowRunStatus.FAILED)
    expect(rejected?.failedAt).toBeInstanceOf(Date)
    expect(rejected?.failure).toEqual({
      code: WorkflowRunFailureCode.APPROVAL_REJECTED,
      message: 'Not ready',
    })
    expect(rejected?.steps[3]?.status).toBe(WorkflowStepStatus.FAILED)

    const decisions = await database.workflowApprovalDecision.findMany({
      where: {
        runId,
      },
    })
    expect(decisions).toHaveLength(1)
    expect(decisions[0]?.outcome).toBe('REJECTED')
    expect(decisions[0]?.reason).toBe('Not ready')
  })

  it('throws when the named step is not the current approval step', async () => {
    const { run } = await orchestrator.start({
      definitionKey: issueImplementFlow.key,
      input: issueImplementFlowInput('JC-23'),
      triggerIdentifier: `workflow-approval-early:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    const pendingApproval = run.steps.find((step) => step.key === 'approval')

    await expect(orchestrator.approve(approvalCommand(run.id, pendingApproval!.id))).rejects.toThrow(
      WorkflowApprovalError,
    )
    await expect(orchestrator.reject(approvalCommand(run.id, pendingApproval!.id))).rejects.toThrow(
      WorkflowApprovalError,
    )
  })

  it('treats a repeated decisionId as an idempotent retry', async () => {
    const { runId, stepId } = await startRunParkedOnApproval('JC-24')
    const command = approvalCommand(runId, stepId, `decision-${randomUUID()}`)

    await orchestrator.approve(command)

    const retry = await orchestrator.approve(command)

    expect(retry?.status).toBe(WorkflowRunStatus.COMPLETED)

    const decisions = await database.workflowApprovalDecision.findMany({
      where: {
        runId,
      },
    })
    expect(decisions).toHaveLength(1)
  })

  it('does not approve a later gate when a delayed retry names the earlier step', async () => {
    const { approvalAId, approvalBId, runId } = await startDualApprovalParkedOnFirstGate('JC-25')
    const firstDecisionId = `decision-a-${randomUUID()}`

    await orchestrator.approve(approvalCommand(runId, approvalAId, firstDecisionId))

    const afterFirst = await database.workflowRun.findUniqueOrThrow({
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

    expect(afterFirst.status).toBe(WorkflowRunStatus.AWAITING_APPROVAL)
    expect(afterFirst.steps.map((step) => step.status)).toEqual([
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.AWAITING_APPROVAL,
    ])

    // Lost-response retry for gate A must not decide gate B.
    const retry = await orchestrator.approve(approvalCommand(runId, approvalAId, firstDecisionId))

    expect(retry?.status).toBe(WorkflowRunStatus.AWAITING_APPROVAL)
    expect(retry?.steps.find((step) => step.id === approvalBId)?.status).toBe(WorkflowStepStatus.AWAITING_APPROVAL)

    // A new command still aimed at the obsolete gate is rejected.
    await expect(
      orchestrator.approve(approvalCommand(runId, approvalAId, `decision-stale-${randomUUID()}`)),
    ).rejects.toMatchObject({
      code: 'WORKFLOW_APPROVAL_ERROR',
      runId,
    })

    const approved = await orchestrator.approve(approvalCommand(runId, approvalBId))

    expect(approved?.status).toBe(WorkflowRunStatus.COMPLETED)
  })

  it('returns null for an unknown run', async () => {
    await expect(orchestrator.approve(approvalCommand(randomUUID(), randomUUID()))).resolves.toBeNull()
    await expect(orchestrator.reject(approvalCommand(randomUUID(), randomUUID()))).resolves.toBeNull()
  })
})
