// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { randomUUID } from 'node:crypto'
import { ConfigModule } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { AgentExecuteJobKind, JiraTriageJobKind, RepositoryReviewJobKind } from '@cortex/protocol'
import { Database, DatabaseModule } from '../../src/infraestructure/database'
import { ExecutionJobStatus } from '../../src/execution/datatypes/execution-job-status'
import { ExecutionJobService } from '../../src/execution/execution-job.service'
import { ExecutionModule } from '../../src/execution/execution.module'
import {
  WorkflowDefinitionRegistry,
  WorkflowModule,
  WorkflowOrchestrator,
  WorkflowRunStatus,
  WorkflowStepKind,
  WorkflowStepStatus,
  issueImplementFlow,
  jiraTriageFlow,
} from '../../src/workflow'
import { agentExecuteJobResult, issueImplementFlowInput, jiraTriageJobResult } from './issue-implement-fixtures'
const PinFlowDefinitionKeyPrefix = 'pin-definition.flow'

describe('WorkflowOrchestrator advance', () => {
  let database: Database
  let executionJobService: ExecutionJobService
  let moduleRef: TestingModule
  let orchestrator: WorkflowOrchestrator

  const createdRunIds: string[] = []

  beforeAll(async () => {
    process.env.NODE_ENV ??= 'development'

    moduleRef = await Test.createTestingModule({
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

    await moduleRef.init()

    database = moduleRef.get(Database)
    executionJobService = moduleRef.get(ExecutionJobService)
    orchestrator = moduleRef.get(WorkflowOrchestrator)
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
      definitionKey: jiraTriageFlow.key,
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

  it('advances JOB→JOB with built payloads and parks before APPROVAL', async () => {
    const input = issueImplementFlowInput('JC-11')
    const { job, run } = await orchestrator.start({
      definitionKey: issueImplementFlow.key,
      input,
      triggerIdentifier: `workflow-advance-multi:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    expect(job.kind).toBe(JiraTriageJobKind)
    expect(job.payload).toEqual({
      connectionId: input.jiraConnectionId,
      issueKey: input.issueKey,
      options: {
        attemptFix: false,
        classifyOnly: false,
        dryRunTests: false,
      },
      repository: input.repository,
      sourceControlConnectionId: input.sourceControlConnectionId,
    })

    const triageResult = jiraTriageJobResult(input.issueKey)
    const firstClaim = await markRunning(job.id)
    await executionJobService.complete(job.id, {
      claimToken: firstClaim.claimToken,
      nodeId: firstClaim.nodeId,
      result: triageResult,
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

    const implementPayload = secondJob?.payload as { agentId: string; input: string; toolNames: string[] }
    expect(implementPayload.agentId).toBe(input.agentId)
    expect(implementPayload.input).toContain(input.issueKey)
    expect(implementPayload.input).toContain(triageResult.classification.rationale)

    const secondClaim = await markRunning(secondJob!.id)
    await executionJobService.complete(secondJob!.id, {
      claimToken: secondClaim.claimToken,
      nodeId: secondClaim.nodeId,
      result: agentExecuteJobResult(),
    })

    const thirdJob = await database.executionJob.findFirst({
      where: {
        runId: run.id,
        kind: RepositoryReviewJobKind,
      },
    })
    expect(thirdJob).not.toBeNull()
    expect(thirdJob?.payload).toEqual({
      change: {
        headRef: input.repository.defaultBranch,
      },
      connectionId: input.sourceControlConnectionId,
      instructions: `Review the implementation for Jira issue ${input.issueKey}.`,
      repository: {
        cloneUrl: input.repository.cloneUrl,
        name: input.repository.name,
        owner: input.repository.owner,
      },
      reviewMode: 'full',
    })

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
    expect(parked?.steps.map((step) => step.key)).toEqual(['triage', 'implement', 'review', 'approval'])
    expect(parked?.steps.map((step) => step.status)).toEqual([
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.COMPLETED,
      WorkflowStepStatus.AWAITING_APPROVAL,
    ])
    expect(parked?.steps[3]?.startedAt).toBeInstanceOf(Date)
  })

  it('does not advance or revive a run that was cancelled before the job completed', async () => {
    const input = issueImplementFlowInput('JC-17')
    const { job, run } = await orchestrator.start({
      definitionKey: issueImplementFlow.key,
      input,
      triggerIdentifier: `workflow-advance-cancelled-run:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    // Simulate the cancel/advance race window: the run is already terminal
    // while the active step is still QUEUED.
    await database.workflowRun.update({
      where: {
        id: run.id,
      },
      data: {
        activeKey: null,
        status: WorkflowRunStatus.CANCELLED,
      },
    })

    const claim = await markRunning(job.id)

    await expect(
      executionJobService.complete(job.id, {
        claimToken: claim.claimToken,
        nodeId: claim.nodeId,
        result: jiraTriageJobResult(input.issueKey),
      }),
    ).rejects.toThrow()

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

    expect(updated?.status).toBe(WorkflowRunStatus.CANCELLED)
    expect(updated?.steps[0]?.status).toBe(WorkflowStepStatus.QUEUED)
    expect(updated?.steps[1]?.status).toBe(WorkflowStepStatus.PENDING)

    const implementJob = await database.executionJob.findFirst({
      where: {
        runId: run.id,
        kind: AgentExecuteJobKind,
      },
    })
    expect(implementJob).toBeNull()
  })

  it('fails the advance without completing the step when the payload builder rejects the output', async () => {
    const input = issueImplementFlowInput('JC-16')
    const { job, run } = await orchestrator.start({
      definitionKey: issueImplementFlow.key,
      input,
      triggerIdentifier: `workflow-advance-bad-output:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    const claim = await markRunning(job.id)

    // Triage completes with an output the implement builder cannot parse.
    await expect(
      executionJobService.complete(job.id, {
        claimToken: claim.claimToken,
        nodeId: claim.nodeId,
      }),
    ).rejects.toThrow()

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

    // The advance transaction rolled back: run still RUNNING, no step advanced.
    expect(updated?.status).toBe(WorkflowRunStatus.RUNNING)
    expect(updated?.steps[0]?.status).toBe(WorkflowStepStatus.QUEUED)
    expect(updated?.steps[1]?.status).toBe(WorkflowStepStatus.PENDING)

    const implementJob = await database.executionJob.findFirst({
      where: {
        runId: run.id,
        kind: AgentExecuteJobKind,
      },
    })
    expect(implementJob).toBeNull()
  })

  it('does not advance when onJobCompleted receives a non-completed job', async () => {
    const { job, run } = await orchestrator.start({
      definitionKey: jiraTriageFlow.key,
      input: { issueKey: 'JC-13' },
      triggerIdentifier: `workflow-advance-premature:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    await orchestrator.onJobCompleted(job.id)

    const updated = await database.workflowRun.findUnique({
      where: {
        id: run.id,
      },
      include: {
        steps: true,
      },
    })

    expect(updated?.status).toBe(WorkflowRunStatus.RUNNING)
    expect(updated?.steps[0]?.status).toBe(WorkflowStepStatus.QUEUED)
  })

  it('advances with the pinned definition version after a newer revision is registered', async () => {
    const definitionKey = `${PinFlowDefinitionKeyPrefix}:${randomUUID()}`
    const registry = moduleRef.get(WorkflowDefinitionRegistry)

    registry.register({
      key: definitionKey,
      version: 1,
      steps: [
        {
          key: 'first',
          kind: WorkflowStepKind.JOB,
          jobKind: JiraTriageJobKind,
          position: 0,
        },
        {
          buildPayload: () => ({ revision: 1 }),
          key: 'second',
          kind: WorkflowStepKind.JOB,
          jobKind: JiraTriageJobKind,
          position: 1,
        },
      ],
    })

    const { job, run } = await orchestrator.start({
      definitionKey,
      input: { issueKey: 'JC-16' },
      triggerIdentifier: `workflow-advance-pin:${randomUUID()}`,
    })
    createdRunIds.push(run.id)
    expect(run.definitionVersion).toBe(1)

    registry.register({
      key: definitionKey,
      version: 2,
      steps: [
        {
          key: 'first',
          kind: WorkflowStepKind.JOB,
          jobKind: JiraTriageJobKind,
          position: 0,
        },
        {
          buildPayload: () => ({ revision: 2 }),
          key: 'second',
          kind: WorkflowStepKind.JOB,
          jobKind: JiraTriageJobKind,
          position: 1,
        },
      ],
    })

    const claim = await markRunning(job.id)
    await executionJobService.complete(job.id, {
      claimToken: claim.claimToken,
      nodeId: claim.nodeId,
      result: jiraTriageJobResult('JC-16'),
    })

    const secondJob = await database.executionJob.findFirst({
      where: {
        runId: run.id,
        stepId: run.steps[1]?.id,
      },
    })

    expect(secondJob?.payload).toEqual({ revision: 1 })
  })

  it('fails the run when a linked job fails', async () => {
    const { job, run } = await orchestrator.start({
      definitionKey: jiraTriageFlow.key,
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

  it('releases the run activeKey when the run completes', async () => {
    const activeKey = `workflow-advance-release:${randomUUID()}`

    const { job, run } = await orchestrator.start({
      activeKey,
      definitionKey: jiraTriageFlow.key,
      input: { issueKey: 'JC-14' },
    })
    createdRunIds.push(run.id)

    const claim = await markRunning(job.id)
    await executionJobService.complete(job.id, {
      claimToken: claim.claimToken,
      nodeId: claim.nodeId,
    })

    const updated = await database.workflowRun.findUnique({
      where: {
        id: run.id,
      },
    })

    expect(updated?.status).toBe(WorkflowRunStatus.COMPLETED)
    expect(updated?.activeKey).toBeNull()

    const successor = await orchestrator.start({
      activeKey,
      definitionKey: jiraTriageFlow.key,
      input: { issueKey: 'JC-14' },
    })
    createdRunIds.push(successor.run.id)

    expect(successor.run.status).toBe(WorkflowRunStatus.RUNNING)
  })

  it('releases the run activeKey when the run fails', async () => {
    const activeKey = `workflow-advance-release-fail:${randomUUID()}`

    const { job, run } = await orchestrator.start({
      activeKey,
      definitionKey: jiraTriageFlow.key,
      input: { issueKey: 'JC-15' },
    })
    createdRunIds.push(run.id)

    const claim = await markRunning(job.id)
    await executionJobService.fail(job.id, {
      claimToken: claim.claimToken,
      failure: {
        code: 'TRIAGE_FAILED',
        message: 'classifier unavailable',
      },
      nodeId: claim.nodeId,
    })

    const updated = await database.workflowRun.findUnique({
      where: {
        id: run.id,
      },
    })

    expect(updated?.status).toBe(WorkflowRunStatus.FAILED)
    expect(updated?.activeKey).toBeNull()
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
