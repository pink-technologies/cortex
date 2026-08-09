// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { randomUUID } from 'node:crypto'
import { ConfigModule } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { JiraTriageJobKind } from '@cortex/protocol'
import { Database, DatabaseModule } from '../../src/infraestructure/database'
import { ExecutionJobStatus } from '../../src/execution/datatypes/execution-job-status'
import { ExecutionModule } from '../../src/execution/execution.module'
import {
  WorkflowDefinitionNotFoundError,
  WorkflowDefinitionRegistry,
  WorkflowModule,
  WorkflowOrchestrator,
  WorkflowRunStatus,
  WorkflowStartError,
  WorkflowStepKind,
  WorkflowStepStatus,
  jiraTriageFlow,
} from '../../src/workflow'
import { issueImplementFlowInput } from './issue-implement-fixtures'
describe('WorkflowOrchestrator.start', () => {
  let database: Database
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

  it('starts a one-step flow with a queued child job', async () => {
    const triggerIdentifier = `workflow-start:${randomUUID()}`
    const input = { issueKey: 'JC-42', summary: 'triage me' }

    const { job, run } = await orchestrator.start({
      activeKey: `workflow-start-active:${randomUUID()}`,
      definitionKey: jiraTriageFlow.key,
      input,
      triggerIdentifier,
    })
    createdRunIds.push(run.id)

    expect(run.status).toBe(WorkflowRunStatus.RUNNING)
    expect(run.definitionKey).toBe(jiraTriageFlow.key)
    expect(run.definitionVersion).toBe(1)
    expect(run.input).toEqual(input)
    expect(run.triggerIdentifier).toBe(triggerIdentifier)
    expect(run.startedAt).toBeInstanceOf(Date)
    expect(run.steps).toHaveLength(1)

    const step = run.steps[0]!
    expect(step.key).toBe('main')
    expect(step.kind).toBe(WorkflowStepKind.JOB)
    expect(step.jobKind).toBe(JiraTriageJobKind)
    expect(step.status).toBe(WorkflowStepStatus.QUEUED)
    expect(step.startedAt).toBeInstanceOf(Date)

    expect(job.status).toBe(ExecutionJobStatus.QUEUED)
    expect(job.kind).toBe(JiraTriageJobKind)
    expect(job.payload).toEqual(input)
    expect(job.runId).toBe(run.id)
    expect(job.stepId).toBe(step.id)

    const persistedJob = await database.executionJob.findUnique({
      where: {
        id: job.id,
      },
    })

    expect(persistedJob).not.toBeNull()
    expect(persistedJob?.status).toBe(ExecutionJobStatus.QUEUED)
    expect(persistedJob?.runId).toBe(run.id)
    expect(persistedJob?.stepId).toBe(step.id)
  })

  it('starts issue.implement.flow by activating the triage JOB step with a built payload', async () => {
    const input = issueImplementFlowInput('JC-99')
    const { job, run } = await orchestrator.start({
      definitionKey: 'issue.implement.flow',
      input,
      triggerIdentifier: `workflow-start-multi:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    expect(run.status).toBe(WorkflowRunStatus.RUNNING)
    expect(run.steps).toHaveLength(4)
    expect(run.steps[0]?.key).toBe('triage')
    expect(run.steps[0]?.status).toBe(WorkflowStepStatus.QUEUED)
    expect(run.steps.slice(1).every((step) => step.status === WorkflowStepStatus.PENDING)).toBe(true)
    expect(job.kind).toBe(JiraTriageJobKind)
    expect(job.stepId).toBe(run.steps[0]?.id)
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
  })

  it('rejects a start whose input fails the first step payload builder', async () => {
    await expect(
      orchestrator.start({
        definitionKey: 'issue.implement.flow',
        input: { issueKey: 'JC-98' },
        triggerIdentifier: `workflow-start-invalid:${randomUUID()}`,
      }),
    ).rejects.toThrow(WorkflowStartError)
  })

  it('records the source on the first child job', async () => {
    const { job, run } = await orchestrator.start({
      definitionKey: jiraTriageFlow.key,
      input: { issueKey: 'JC-30' },
      source: {
        identifier: 'delivery-42',
        type: 'webhook',
      },
      triggerIdentifier: `workflow-start-source:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    const persistedJob = await database.executionJob.findUnique({
      where: {
        id: job.id,
      },
    })

    expect(persistedJob?.sourceType).toBe('webhook')
    expect(persistedJob?.sourceIdentifier).toBe('delivery-42')
  })

  it('throws when the definition key is unknown', async () => {
    await expect(
      orchestrator.start({
        definitionKey: 'missing.flow',
        input: {},
      }),
    ).rejects.toThrow(WorkflowDefinitionNotFoundError)
  })

  it('returns the existing run for a duplicate triggerIdentifier', async () => {
    const triggerIdentifier = `workflow-start-dup:${randomUUID()}`

    const first = await orchestrator.start({
      definitionKey: jiraTriageFlow.key,
      input: { issueKey: 'JC-1' },
      triggerIdentifier,
    })
    createdRunIds.push(first.run.id)

    const second = await orchestrator.start({
      definitionKey: jiraTriageFlow.key,
      input: { issueKey: 'JC-2' },
      triggerIdentifier,
    })

    expect(second.created).toBe(false)
    expect(second.run.id).toBe(first.run.id)
    expect(second.job.id).toBe(first.job.id)
  })

  it('skips payload builders on idempotent start retries', async () => {
    const definitionKey = `start-idempotent-builder.flow:${randomUUID()}`
    let buildCount = 0
    const registry = moduleRef.get(WorkflowDefinitionRegistry)

    registry.register({
      key: definitionKey,
      version: 1,
      steps: [
        {
          buildPayload: (context) => {
            buildCount += 1
            if ((context.input as { explode?: boolean }).explode) {
              throw new Error('builder should not run on retry')
            }
            return context.input
          },
          key: 'main',
          kind: WorkflowStepKind.JOB,
          jobKind: JiraTriageJobKind,
          position: 0,
        },
      ],
    })

    const triggerIdentifier = `workflow-start-builder-skip:${randomUUID()}`
    const first = await orchestrator.start({
      definitionKey,
      input: { issueKey: 'JC-1' },
      triggerIdentifier,
    })
    createdRunIds.push(first.run.id)
    expect(buildCount).toBe(1)

    buildCount = 0
    const second = await orchestrator.start({
      definitionKey,
      input: { explode: true, issueKey: 'JC-2' },
      triggerIdentifier,
    })

    expect(second.created).toBe(false)
    expect(second.run.id).toBe(first.run.id)
    expect(buildCount).toBe(0)
  })
})
