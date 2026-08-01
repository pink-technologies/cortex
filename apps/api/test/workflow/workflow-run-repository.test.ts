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

import {
  WorkflowRunCreateError,
  WorkflowRunUpdateError,
  WorkflowStepUpdateError,
} from '../../src/workflow/error/error'

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

    const created = await repository.create({
      activeKey: `workflow-test-active:${randomUUID()}`,
      definitionKey: 'jira.triage.flow',
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
    createdRunIds.push(created.id)

    expect(created.status).toBe(WorkflowRunStatus.PENDING)
    expect(created.definitionKey).toBe('jira.triage.flow')
    expect(created.input).toEqual({ issueKey: 'JC-1' })
    expect(created.triggerIdentifier).toBe(triggerIdentifier)
    expect(created.steps).toHaveLength(2)
    expect(created.steps.map((step) => step.key)).toEqual(['triage', 'approval'])
    expect(created.steps[0]?.kind).toBe(WorkflowStepKind.JOB)
    expect(created.steps[0]?.jobKind).toBe('jira.triage')
    expect(created.steps[0]?.status).toBe(WorkflowStepStatus.PENDING)
    expect(created.steps[1]?.kind).toBe(WorkflowStepKind.APPROVAL)
    expect(created.steps[1]?.jobKind).toBeNull()

    const loaded = await repository.findById(created.id)

    expect(loaded).not.toBeNull()
    expect(loaded?.id).toBe(created.id)
    expect(loaded?.steps.map((step) => step.key)).toEqual(['triage', 'approval'])
  })

  it('returns null when the run does not exist', async () => {
    await expect(repository.findById(randomUUID())).resolves.toBeNull()
  })

  it('updates run and step statuses', async () => {
    const created = await repository.create({
      definitionKey: 'repository.review.flow',
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
    createdRunIds.push(created.id)

    const stepId = created.steps[0]!.id
    const startedAt = new Date()

    await expect(
      repository.updateRunStatus(created.id, {
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

    const afterActivate = await repository.findById(created.id)

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
      repository.updateRunStatus(created.id, {
        completedAt,
        result: { ok: true },
        status: WorkflowRunStatus.COMPLETED,
      }),
    ).resolves.toBe(true)

    const afterComplete = await repository.findById(created.id)

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

  it('rejects duplicate triggerIdentifier on create', async () => {
    const triggerIdentifier = `workflow-test-dup:${randomUUID()}`

    const created = await repository.create({
      definitionKey: 'agent.execute.flow',
      input: {},
      triggerIdentifier,
      steps: [
        {
          key: 'main',
          jobKind: 'agent.execute',
          kind: WorkflowStepKind.JOB,
          position: 0,
        },
      ],
    })
    createdRunIds.push(created.id)

    await expect(
      repository.create({
        definitionKey: 'agent.execute.flow',
        input: {},
        triggerIdentifier,
        steps: [
          {
            key: 'main',
            jobKind: 'agent.execute',
            kind: WorkflowStepKind.JOB,
            position: 0,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(WorkflowRunCreateError)
  })

  it('wraps unexpected update failures', async () => {
    const created = await repository.create({
      definitionKey: 'agent.execute.flow',
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
    createdRunIds.push(created.id)

    const runSpy = jest.spyOn(database.workflowRun, 'updateMany').mockRejectedValueOnce(new Error('db down'))
    await expect(
      repository.updateRunStatus(created.id, { status: WorkflowRunStatus.FAILED }),
    ).rejects.toBeInstanceOf(WorkflowRunUpdateError)
    runSpy.mockRestore()

    const stepSpy = jest.spyOn(database.workflowStep, 'updateMany').mockRejectedValueOnce(new Error('db down'))
    await expect(
      repository.updateStepStatus(created.steps[0]!.id, { status: WorkflowStepStatus.FAILED }),
    ).rejects.toBeInstanceOf(WorkflowStepUpdateError)
    stepSpy.mockRestore()
  })
})
