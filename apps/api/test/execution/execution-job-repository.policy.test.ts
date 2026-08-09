// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { randomUUID } from 'node:crypto'
import { ConfigModule } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { ZodError } from 'zod'
import { AgentExecuteJobKind } from '@cortex/protocol'
import { Database, DatabaseModule } from '../../src/infraestructure/database'
import {
  EXECUTION_JOB_REPOSITORY,
  ExecutionJobRepositoryImpl,
  type ExecutionJobRepository,
} from '../../src/execution/execution-job-repository'
import { ExecutionJobStatus } from '../../src/execution/datatypes/execution-job-status'
import { ExecutionJobCreateError } from '../../src/execution/error/error'
import { ExecutionJobService } from '../../src/execution/execution-job.service'
import { NodesModule } from '../../src/nodes/nodes.module'
import { NodesService } from '../../src/nodes/nodes.service'
import { WORKFLOW_JOB_LIFECYCLE } from '../../src/execution/ports'

describe('ExecutionJobRepository policy and requirements', () => {
  let database: Database
  let moduleRef: TestingModule
  let repository: ExecutionJobRepository

  const createdJobIds: string[] = []

  beforeAll(async () => {
    process.env.NODE_ENV ??= 'development'

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: `env/.env.${process.env.NODE_ENV ?? 'development'}`,
          isGlobal: true,
        }),
        DatabaseModule,
        NodesModule,
      ],
      providers: [
        ExecutionJobService,
        {
          provide: EXECUTION_JOB_REPOSITORY,
          useClass: ExecutionJobRepositoryImpl,
        },
        {
          provide: WORKFLOW_JOB_LIFECYCLE,
          useValue: {
            onJobClaimed: jest.fn(),
            onJobCompleted: jest.fn(),
            onJobFailed: jest.fn(),
          },
        },
      ],
    }).compile()

    await moduleRef.init()

    database = moduleRef.get(Database)
    repository = moduleRef.get(EXECUTION_JOB_REPOSITORY)
  })

  afterEach(async () => {
    if (createdJobIds.length === 0) {
      return
    }

    await database.executionJob.deleteMany({
      where: {
        id: {
          in: [...createdJobIds],
        },
      },
    })
    createdJobIds.length = 0
  })

  afterAll(async () => {
    await database.$disconnect()
  })

  it('rejects create when policy violates the schema', async () => {
    await expect(
      repository.create({
        kind: AgentExecuteJobKind,
        payload: { agentId: 'assistant', input: 'hi' },
        policy: {
          maximumDurationSeconds: -1,
        } as never,
        priority: 100,
        requirements: {
          allOf: [],
        },
      }),
    ).rejects.toBeInstanceOf(ZodError)
  })

  it('rejects create when requirements violate the schema', async () => {
    await expect(
      repository.create({
        kind: AgentExecuteJobKind,
        payload: { agentId: 'assistant', input: 'hi' },
        policy: {},
        priority: 100,
        requirements: {
          allOf: [''],
        } as never,
      }),
    ).rejects.toBeInstanceOf(ZodError)
  })

  it('persists validated policy and requirements on create', async () => {
    const job = await repository.create({
      kind: AgentExecuteJobKind,
      payload: { agentId: 'assistant', input: 'hi' },
      policy: {
        maximumDurationSeconds: 60,
        preserveWorkspaceOnFailure: true,
      },
      priority: 50,
      requirements: {
        allOf: ['git'],
        labels: ['macos'],
      },
    })
    createdJobIds.push(job.id)

    expect(job.policy).toEqual({
      maximumDurationSeconds: 60,
      preserveWorkspaceOnFailure: true,
    })
    expect(job.requirements).toEqual({
      allOf: ['git'],
      labels: ['macos'],
    })
  })

  it('fails closed when claiming a job with corrupt persisted requirements', async () => {
    const job = await repository.create({
      kind: AgentExecuteJobKind,
      payload: { agentId: 'assistant', input: 'hi' },
      policy: {},
      priority: 10_000,
      requirements: {
        allOf: [],
      },
    })
    createdJobIds.push(job.id)

    await database.executionJob.update({
      where: {
        id: job.id,
      },
      data: {
        requirements: {
          allOf: 'not-an-array',
        },
      },
    })

    await expect(
      repository.claimNextAvailable({
        capabilities: [],
        labels: [],
        nodeId: `node-${randomUUID()}`,
        supportedKinds: [AgentExecuteJobKind],
      }),
    ).rejects.toBeInstanceOf(ZodError)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: job.id,
      },
    })

    expect(persisted?.status).toBe(ExecutionJobStatus.QUEUED)
  })
})

describe('ExecutionJobService create validation', () => {
  it('maps repository Zod failures to ExecutionJobCreateError', async () => {
    const repository = {
      create: jest.fn().mockRejectedValue(new ZodError([])),
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExecutionJobService,
        {
          provide: EXECUTION_JOB_REPOSITORY,
          useValue: repository,
        },
        {
          provide: NodesService,
          useValue: {},
        },
        {
          provide: WORKFLOW_JOB_LIFECYCLE,
          useValue: {
            onJobClaimed: jest.fn(),
            onJobCompleted: jest.fn(),
            onJobFailed: jest.fn(),
          },
        },
      ],
    }).compile()

    const service = moduleRef.get(ExecutionJobService)

    await expect(
      service.create({
        kind: AgentExecuteJobKind,
        payload: {},
        policy: {},
        priority: 0,
        requirements: {
          allOf: [],
        },
      }),
    ).rejects.toBeInstanceOf(ExecutionJobCreateError)
  })
})
