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
import {
  AgentExecuteJobKind,
  NodeArchitecture,
  NodeOperatingSystem,
} from '@cortex/protocol'
import { AppModule } from '../../../src/app.module'
import { Database } from '../../../src/infraestructure/database'
import { ExecutionJobStatus } from '../../../src/execution/datatypes/execution-job-status'

const agentExecutePayload = {
  agentId: 'assistant',
  input: 'Reply with hello.',
  toolNames: [] as string[],
}

const agentFailure = {
  code: 'AGENT_NOT_FOUND',
  message: "Agent 'assistant' was not found",
}

describe('POST /execution-jobs/:id/fail (e2e)', () => {
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
      await database.executionJob.deleteMany({
        where: {
          id: {
            in: [...createdJobIds],
          },
        },
      })
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
   * Creates an agent.execute job and tracks it for cleanup.
   */
  async function createAgentExecutionJob() {
    const response = await request(app.getHttpServer())
      .post('/api/execution-jobs/agent-executions')
      .send({
        payload: agentExecutePayload,
      })
      .expect(HttpStatus.CREATED)

    const jobId = response.body.id as string
    createdJobIds.push(jobId)

    return jobId
  }

  /**
   * Registers an execution Node and tracks it for cleanup.
   */
  async function registerExecutionNode() {
    const installationId = randomUUID()
    const response = await request(app.getHttpServer())
      .post('/api/internal/nodes/register')
      .send({
        architecture: NodeArchitecture.ARM64,
        capabilities: ['os.macos'],
        installationId,
        labels: [] as string[],
        name: `e2e-fail-node-${installationId.slice(0, 8)}`,
        operatingSystem: NodeOperatingSystem.MACOS,
        supportedKinds: [AgentExecuteJobKind],
        version: '0.1.0',
      })
      .expect(HttpStatus.CREATED)

    createdNodeIds.push(response.body.nodeId)

    return response.body.nodeId as string
  }

  /**
   * Claims the next available job for the given Node.
   */
  async function claimJob(nodeId: string) {
    const response = await request(app.getHttpServer())
      .post('/api/internal/execution-jobs/claim')
      .send({
        nodeId,
      })
      .expect(HttpStatus.OK)

    return response.body as {
      job: null | {
        id: string
        claimToken: string | null
      }
    }
  }

  /**
   * Creates and claims a running agent.execute job.
   */
  async function createRunningJob() {
    const jobId = await createAgentExecutionJob()
    const nodeId = await registerExecutionNode()
    const claim = await claimJob(nodeId)

    expect(claim.job?.id).toBe(jobId)
    expect(claim.job?.claimToken).toEqual(expect.any(String))

    return {
      claimToken: claim.job!.claimToken as string,
      jobId,
      nodeId,
    }
  }

  it('persists and returns a failed execution job', async () => {
    const { claimToken, jobId, nodeId } = await createRunningJob()
    const failure = agentFailure

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/fail`)
      .send({
        claimToken,
        failure,
        nodeId,
      })
      .expect(HttpStatus.NO_CONTENT)

    const response = await request(app.getHttpServer())
      .get(`/api/execution-jobs/${jobId}`)
      .expect(HttpStatus.OK)

    expect(response.body).toEqual({
      completedAt: null,
      createdAt: expect.any(String),
      failedAt: expect.any(String),
      failure,
      id: jobId,
      kind: AgentExecuteJobKind,
      result: null,
      status: ExecutionJobStatus.FAILED,
    })

    expect(Number.isNaN(Date.parse(response.body.createdAt))).toBe(false)
    expect(Number.isNaN(Date.parse(response.body.failedAt))).toBe(false)
  })

  it('rejects an invalid failure request', async () => {
    const { claimToken, jobId, nodeId } = await createRunningJob()

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/fail`)
      .send({
        claimToken,
        failure: {
          code: '',
          message: 'missing code',
        },
        nodeId,
      })
      .expect(HttpStatus.BAD_REQUEST)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: jobId,
      },
    })

    expect(persisted?.status).toBe(ExecutionJobStatus.RUNNING)
    expect(persisted?.failedAt).toBeNull()
    expect(persisted?.failure).toBeNull()
  })

  it('rejects failing a queued job', async () => {
    const jobId = await createAgentExecutionJob()

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/fail`)
      .send({
        claimToken: randomUUID(),
        failure: agentFailure,
        nodeId: randomUUID(),
      })
      .expect(HttpStatus.CONFLICT)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: jobId,
      },
    })

    expect(persisted?.status).toBe(ExecutionJobStatus.QUEUED)
    expect(persisted?.failedAt).toBeNull()
  })

  it('rejects failing an already completed job', async () => {
    const { claimToken, jobId, nodeId } = await createRunningJob()

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/complete`)
      .send({
        claimToken,
        nodeId,
        result: {
          executionId: jobId,
          iterationCount: 1,
          output: 'Hello.',
          usage: {
            inputTokens: 1,
            outputTokens: 1,
            totalTokens: 2,
          },
        },
      })
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/fail`)
      .send({
        claimToken,
        failure: agentFailure,
        nodeId,
      })
      .expect(HttpStatus.CONFLICT)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: jobId,
      },
    })

    expect(persisted?.status).toBe(ExecutionJobStatus.COMPLETED)
    expect(persisted?.failedAt).toBeNull()
  })

  it('accepts failing the same job twice from the same claim', async () => {
    const { claimToken, jobId, nodeId } = await createRunningJob()
    const failBody = {
      claimToken,
      failure: agentFailure,
      nodeId,
    }

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/fail`)
      .send(failBody)
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/fail`)
      .send(failBody)
      .expect(HttpStatus.NO_CONTENT)
  })
})
