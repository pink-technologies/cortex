// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { randomUUID } from 'node:crypto'
import { ConfigModule } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { DatabaseModule, Database } from '../../src/infraestructure/database'
import { WorkflowRunStatus, WorkflowStepKind, WorkflowStepStatus } from '../../src/workflow/datatypes'
import {
  WORKFLOW_RUN_REPOSITORY,
  WorkflowRunRepositoryImpl,
  type WorkflowRunRepository,
} from '../../src/workflow/repository'

import { WorkflowRunUpdateError, WorkflowStepUpdateError } from '../../src/workflow/error/error'

describe('WorkflowRunRepository', () => {
  let database: Database
  let repository: WorkflowRunRepository

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
      ],
      providers: [
        {
          provide: WORKFLOW_RUN_REPOSITORY,
          useClass: WorkflowRunRepositoryImpl,
        },
      ],
    }).compile()

    await module.init()

    database = module.get(Database)
    repository = module.get(WORKFLOW_RUN_REPOSITORY)
  })

  afterEach(async () => {
    if (createdRunIds.length === 0) {
      return
    }

    await database.workflowRun.deleteMany({
      where: {
        id: {
          in: [...createdRunIds],
        },
      },
    })
    createdRunIds.length = 0
  })

  afterAll(async () => {
    await database.$disconnect()
  })

  it('creates a run with ordered steps and loads it by id', async () => {
    const triggerIdentifier = `workflow-test:${randomUUID()}`

    const { created, run } = await repository.getOrCreate({
      activeKey: `workflow-test-active:${randomUUID()}`,
      definitionKey: 'jira.triage.flow',
      definitionVersion: 1,
      input: { issueKey: 'JC-1' },
      triggerIdentifier,
      steps: [
        {
          key: 'approval',
          kind: WorkflowStepKind.APPROVAL,
          position: 1,
        },
        {
          key: 'triage',
          jobKind: 'jira.triage',
          kind: WorkflowStepKind.JOB,
          position: 0,
          input: { issueKey: 'JC-1' },
        },
      ],
    })
    createdRunIds.push(run.id)

    expect(created).toBe(true)
    expect(run.status).toBe(WorkflowRunStatus.PENDING)
    expect(run.definitionKey).toBe('jira.triage.flow')
    expect(run.definitionVersion).toBe(1)
    expect(run.input).toEqual({ issueKey: 'JC-1' })
    expect(run.triggerIdentifier).toBe(triggerIdentifier)
    expect(run.steps).toHaveLength(2)
    expect(run.steps.map((step) => step.key)).toEqual(['triage', 'approval'])
    expect(run.steps[0]?.kind).toBe(WorkflowStepKind.JOB)
    expect(run.steps[0]?.jobKind).toBe('jira.triage')
    expect(run.steps[0]?.status).toBe(WorkflowStepStatus.PENDING)
    expect(run.steps[1]?.kind).toBe(WorkflowStepKind.APPROVAL)
    expect(run.steps[1]?.jobKind).toBeNull()

    const loaded = await repository.findById(run.id)

    expect(loaded).not.toBeNull()
    expect(loaded?.id).toBe(run.id)
    expect(loaded?.steps.map((step) => step.key)).toEqual(['triage', 'approval'])
  })

  it('returns null when the run does not exist', async () => {
    await expect(repository.findById(randomUUID())).resolves.toBeNull()
  })

  it('updates run and step statuses', async () => {
    const { run } = await repository.getOrCreate({
      definitionKey: 'repository.review.flow',
      definitionVersion: 1,
      input: { pullNumber: 12 },
      steps: [
        {
          key: 'review',
          jobKind: 'repository.review',
          kind: WorkflowStepKind.JOB,
          position: 0,
        },
      ],
    })
    createdRunIds.push(run.id)

    const stepId = run.steps[0]!.id
    const startedAt = new Date()

    await expect(
      repository.updateRunStatus(run.id, {
        startedAt,
        status: WorkflowRunStatus.RUNNING,
      }),
    ).resolves.toBe(true)

    await expect(
      repository.updateStepStatus(stepId, {
        startedAt,
        status: WorkflowStepStatus.QUEUED,
      }),
    ).resolves.toBe(true)

    const afterActivate = await repository.findById(run.id)

    expect(afterActivate?.status).toBe(WorkflowRunStatus.RUNNING)
    expect(afterActivate?.startedAt).toEqual(startedAt)
    expect(afterActivate?.steps[0]?.status).toBe(WorkflowStepStatus.QUEUED)

    const completedAt = new Date()

    await expect(
      repository.updateStepStatus(stepId, {
        completedAt,
        output: { reviewUrl: 'https://example.com/pr/12' },
        status: WorkflowStepStatus.COMPLETED,
      }),
    ).resolves.toBe(true)

    await expect(
      repository.updateRunStatus(run.id, {
        completedAt,
        result: { ok: true },
        status: WorkflowRunStatus.COMPLETED,
      }),
    ).resolves.toBe(true)

    const afterComplete = await repository.findById(run.id)

    expect(afterComplete?.status).toBe(WorkflowRunStatus.COMPLETED)
    expect(afterComplete?.result).toEqual({ ok: true })
    expect(afterComplete?.steps[0]?.status).toBe(WorkflowStepStatus.COMPLETED)
    expect(afterComplete?.steps[0]?.output).toEqual({ reviewUrl: 'https://example.com/pr/12' })
  })

  it('returns false when updating a missing run or step', async () => {
    await expect(
      repository.updateRunStatus(randomUUID(), {
        status: WorkflowRunStatus.FAILED,
      }),
    ).resolves.toBe(false)

    await expect(
      repository.updateStepStatus(randomUUID(), {
        status: WorkflowStepStatus.FAILED,
      }),
    ).resolves.toBe(false)
  })

  it('returns the existing run for a duplicate triggerIdentifier', async () => {
    const triggerIdentifier = `workflow-test-dup:${randomUUID()}`
    const steps = [
      {
        key: 'main',
        jobKind: 'agent.execute',
        kind: WorkflowStepKind.JOB,
        position: 0,
      },
    ]

    const first = await repository.getOrCreate({
      definitionKey: 'agent.execute.flow',
      definitionVersion: 1,
      input: {},
      triggerIdentifier,
      steps,
    })
    createdRunIds.push(first.run.id)

    expect(first.created).toBe(true)

    const reused = await repository.getOrCreate({
      definitionKey: 'agent.execute.flow',
      definitionVersion: 1,
      input: { reused: true },
      triggerIdentifier,
      steps,
    })

    expect(reused.created).toBe(false)
    expect(reused.run.id).toBe(first.run.id)
  })

  it('lists runs newest first with paging, filters, and totals', async () => {
    const definitionKey = `list-test:${randomUUID()}`
    const steps = [
      {
        key: 'main',
        jobKind: 'agent.execute',
        kind: WorkflowStepKind.JOB,
        position: 0,
      },
    ]

    const first = await repository.getOrCreate({ definitionKey, definitionVersion: 1, input: { order: 1 }, steps })
    const second = await repository.getOrCreate({ definitionKey, definitionVersion: 1, input: { order: 2 }, steps })
    const third = await repository.getOrCreate({ definitionKey, definitionVersion: 1, input: { order: 3 }, steps })
    createdRunIds.push(first.run.id, second.run.id, third.run.id)

    await repository.updateRunStatus(second.run.id, { status: WorkflowRunStatus.RUNNING })

    const firstPage = await repository.findMany({ definitionKey, limit: 2, page: 1 })

    expect(firstPage.total).toBe(3)
    expect(firstPage.items.map((run) => run.id)).toEqual([third.run.id, second.run.id])
    expect(firstPage.items[0]?.steps.map((step) => step.key)).toEqual(['main'])

    const secondPage = await repository.findMany({ definitionKey, limit: 2, page: 2 })

    expect(secondPage.total).toBe(3)
    expect(secondPage.items.map((run) => run.id)).toEqual([first.run.id])

    const runningOnly = await repository.findMany({
      definitionKey,
      limit: 10,
      page: 1,
      status: WorkflowRunStatus.RUNNING,
    })

    expect(runningOnly.total).toBe(1)
    expect(runningOnly.items.map((run) => run.id)).toEqual([second.run.id])
  })

  it('guards run status updates with onlyIfStatusIn', async () => {
    const { run } = await repository.getOrCreate({
      definitionKey: 'agent.execute.flow',
      definitionVersion: 1,
      input: {},
      steps: [
        {
          key: 'main',
          jobKind: 'agent.execute',
          kind: WorkflowStepKind.JOB,
          position: 0,
        },
      ],
    })
    createdRunIds.push(run.id)

    await expect(
      repository.updateRunStatus(
        run.id,
        { status: WorkflowRunStatus.CANCELLED },
        { onlyIfStatusIn: [WorkflowRunStatus.RUNNING] },
      ),
    ).resolves.toBe(false)

    const untouched = await repository.findById(run.id)
    expect(untouched?.status).toBe(WorkflowRunStatus.PENDING)

    await expect(
      repository.updateRunStatus(
        run.id,
        { status: WorkflowRunStatus.CANCELLED },
        { onlyIfStatusIn: [WorkflowRunStatus.PENDING] },
      ),
    ).resolves.toBe(true)

    const cancelled = await repository.findById(run.id)
    expect(cancelled?.status).toBe(WorkflowRunStatus.CANCELLED)
  })

  it('wraps unexpected update failures', async () => {
    const { run } = await repository.getOrCreate({
      definitionKey: 'agent.execute.flow',
      definitionVersion: 1,
      input: {},
      steps: [
        {
          key: 'main',
          jobKind: 'agent.execute',
          kind: WorkflowStepKind.JOB,
          position: 0,
        },
      ],
    })
    createdRunIds.push(run.id)

    const runSpy = jest.spyOn(database.workflowRun, 'updateMany').mockRejectedValueOnce(new Error('db down'))
    await expect(
      repository.updateRunStatus(run.id, { status: WorkflowRunStatus.FAILED }),
    ).rejects.toBeInstanceOf(WorkflowRunUpdateError)
    runSpy.mockRestore()

    const stepSpy = jest.spyOn(database.workflowStep, 'updateMany').mockRejectedValueOnce(new Error('db down'))
    await expect(
      repository.updateStepStatus(run.steps[0]!.id, { status: WorkflowStepStatus.FAILED }),
    ).rejects.toBeInstanceOf(WorkflowStepUpdateError)
    stepSpy.mockRestore()
  })
})
