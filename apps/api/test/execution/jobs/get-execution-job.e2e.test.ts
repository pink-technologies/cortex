// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { randomUUID } from 'node:crypto'
import {
  HttpStatus,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { AgentExecuteJobKind, NodeArchitecture, NodeOperatingSystem } from '@cortex/protocol'
import { AppModule } from '../../../src/app.module'
import { Database } from '../../../src/infraestructure/database'
import { ExecutionJobStatus } from '../../../src/execution/datatypes/execution-job-status'

describe('GET /execution-jobs/:id (e2e)', () => {
  let app: INestApplication
  let database: Database

  const createdJobIds: string[] = []
  const createdNodeIds: string[] = []

  beforeAll(async () => {
    process.env.NODE_ENV ??= 'development'

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    )

    await app.init()

    database = app.get(Database)

    await database.executionJob.deleteMany({
      where: {
        kind: AgentExecuteJobKind,
        status: {
          in: [ExecutionJobStatus.QUEUED, ExecutionJobStatus.RUNNING],
        },
      },
    })
  })

  afterEach(async () => {
    if (createdJobIds.length > 0) {
      const linkedRuns = await database.executionJob.findMany({
        select: {
          runId: true,
        },
        where: {
          id: {
            in: [...createdJobIds],
          },
        },
      })
      const runIds = linkedRuns
        .map((job) => job.runId)
        .filter((runId): runId is string => runId != null)

      await database.executionJob.deleteMany({
        where: {
          id: {
            in: [...createdJobIds],
          },
        },
      })

      if (runIds.length > 0) {
        await database.workflowRun.deleteMany({
          where: {
            id: {
              in: runIds,
            },
          },
        })
      }

      createdJobIds.length = 0
    }

    if (createdNodeIds.length > 0) {
      await database.executionNode.deleteMany({
        where: {
          id: {
            in: [...createdNodeIds],
          },
        },
      })
      createdNodeIds.length = 0
    }
  })

  afterAll(async () => {
    await app.close()
  })

  /**
   * Registers an execution Node and tracks it for cleanup.
   */
  async function registerExecutionNode(
    overrides: {
      supportedKinds?: string[]
    } = {},
  ) {
    const installationId = randomUUID()
    const response = await request(app.getHttpServer())
      .post('/api/internal/nodes/register')
      .send({
        architecture: NodeArchitecture.ARM64,
        capabilities: ['os.macos'],
        installationId,
        labels: [] as string[],
        name: `e2e-get-node-${installationId.slice(0, 8)}`,
        operatingSystem: NodeOperatingSystem.MACOS,
        supportedKinds: overrides.supportedKinds ?? [
          'system.test',
          AgentExecuteJobKind,
        ],
        version: '0.1.0',
      })
      .expect(HttpStatus.CREATED)

    createdNodeIds.push(response.body.nodeId)

    return response.body.nodeId as string
  }

  it('returns a completed execution job with its result', async () => {
    const nodeId = await registerExecutionNode({
      supportedKinds: [AgentExecuteJobKind],
    })

    const createResponse = await request(app.getHttpServer())
      .post('/api/execution-jobs/agent-executions')
      .send({
        payload: {
          agentId: 'assistant',
          input: 'Reply with hello.',
          toolNames: [],
        },
      })
      .expect(HttpStatus.CREATED)

    const jobId = createResponse.body.id as string
    createdJobIds.push(jobId)

    const claimResponse = await request(app.getHttpServer())
      .post('/api/internal/execution-jobs/claim')
      .send({
        nodeId,
      })
      .expect(HttpStatus.OK)

    const result = {
      executionId: jobId,
      iterationCount: 1,
      output: 'Hello.',
      usage: {
        inputTokens: 10,
        outputTokens: 2,
        totalTokens: 12,
      },
    }

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/complete`)
      .send({
        claimToken: claimResponse.body.job.claimToken,
        nodeId,
        result,
      })
      .expect(HttpStatus.NO_CONTENT)

    const response = await request(app.getHttpServer())
      .get(`/api/execution-jobs/${jobId}`)
      .expect(HttpStatus.OK)

    expect(response.body).toEqual({
      completedAt: expect.any(String),
      createdAt: expect.any(String),
      failedAt: null,
      failure: null,
      id: jobId,
      kind: AgentExecuteJobKind,
      result,
      runId: expect.any(String),
      status: ExecutionJobStatus.COMPLETED,
    })

    expect(Number.isNaN(Date.parse(response.body.createdAt))).toBe(false)
    expect(Number.isNaN(Date.parse(response.body.completedAt))).toBe(false)
  })

  it('returns null completedAt and result for a queued job', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/execution-jobs/agent-executions')
      .send({
        payload: {
          agentId: 'assistant',
          input: 'Reply with hello.',
          toolNames: [],
        },
      })
      .expect(HttpStatus.CREATED)

    const jobId = createResponse.body.id as string
    createdJobIds.push(jobId)

    const response = await request(app.getHttpServer())
      .get(`/api/execution-jobs/${jobId}`)
      .expect(HttpStatus.OK)

    expect(response.body).toEqual({
      completedAt: null,
      createdAt: expect.any(String),
      failedAt: null,
      failure: null,
      id: jobId,
      kind: AgentExecuteJobKind,
      result: null,
      runId: expect.any(String),
      status: ExecutionJobStatus.QUEUED,
    })
  })

  it('returns not found when the execution job does not exist', async () => {
    await request(app.getHttpServer())
      .get('/api/execution-jobs/non-existing-job')
      .expect(HttpStatus.NOT_FOUND)
  })
})
