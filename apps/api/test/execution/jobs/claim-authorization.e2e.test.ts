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

const agentExecuteResult = (executionId: string) => ({
  executionId,
  iterationCount: 1,
  output: 'Hello.',
  usage: {
    inputTokens: 10,
    outputTokens: 2,
    totalTokens: 12,
  },
})

const agentFailure = {
  code: 'AGENT_NOT_FOUND',
  message: "Agent 'assistant' was not found",
}

describe('execution-job claim authorization (e2e)', () => {
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
        name: `e2e-claim-node-${installationId.slice(0, 8)}`,
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

  it('completes a job with the matching Node and claim token', async () => {
    const { claimToken, jobId, nodeId } = await createRunningJob()
    const result = agentExecuteResult(jobId)

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/complete`)
      .send({
        claimToken,
        nodeId,
        result,
      })
      .expect(HttpStatus.NO_CONTENT)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: jobId,
      },
    })

    expect(persisted).toEqual(
      expect.objectContaining({
        id: jobId,
        status: ExecutionJobStatus.COMPLETED,
        completedAt: expect.any(Date),
        claimToken,
        claimedByNodeId: nodeId,
        result,
      }),
    )
  })

  it('accepts a repeated completion from the same claim attempt', async () => {
    const { claimToken, jobId, nodeId } = await createRunningJob()
    const result = agentExecuteResult(jobId)
    const completeBody = {
      claimToken,
      nodeId,
      result,
    }

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/complete`)
      .send(completeBody)
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/complete`)
      .send(completeBody)
      .expect(HttpStatus.NO_CONTENT)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: jobId,
      },
    })

    expect(persisted?.status).toBe(ExecutionJobStatus.COMPLETED)
  })

  it('rejects completion with a different Node', async () => {
    const { claimToken, jobId } = await createRunningJob()
    const otherNodeId = await registerExecutionNode()

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/complete`)
      .send({
        claimToken,
        nodeId: otherNodeId,
        result: agentExecuteResult(jobId),
      })
      .expect(HttpStatus.CONFLICT)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: jobId,
      },
    })

    expect(persisted?.status).toBe(ExecutionJobStatus.RUNNING)
    expect(persisted?.completedAt).toBeNull()
    expect(persisted?.claimToken).toBeTruthy()
  })

  it('rejects completion with a different claim token', async () => {
    const { jobId, nodeId } = await createRunningJob()
    const result = agentExecuteResult(jobId)

    await request(app.getHttpServer())
      .post(
        `/api/internal/execution-jobs/${jobId}/complete`,
      )
      .send({
        claimToken: randomUUID(),
        nodeId,
        result,
      })
      .expect(HttpStatus.CONFLICT)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: jobId,
      },
    })

    expect(persisted?.status).toBe(ExecutionJobStatus.RUNNING)
    expect(persisted?.completedAt).toBeNull()
  })

  it('fails a job with the matching Node and claim token', async () => {
    const { claimToken, jobId, nodeId } = await createRunningJob()

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/fail`)
      .send({
        claimToken,
        failure: agentFailure,
        nodeId,
      })
      .expect(HttpStatus.NO_CONTENT)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: jobId,
      },
    })

    expect(persisted).toEqual(
      expect.objectContaining({
        id: jobId,
        status: ExecutionJobStatus.FAILED,
        failedAt: expect.any(Date),
        failure: agentFailure,
        claimToken,
        claimedByNodeId: nodeId,
      }),
    )
  })

  it('accepts a repeated failure from the same claim attempt', async () => {
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

    const persisted = await database.executionJob.findUnique({
      where: {
        id: jobId,
      },
    })

    expect(persisted?.status).toBe(ExecutionJobStatus.FAILED)
  })

  it('rejects repeated completion from another Node', async () => {
    const { claimToken, jobId, nodeId } = await createRunningJob()
    const otherNodeId = await registerExecutionNode()
    const result = agentExecuteResult(jobId)

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/complete`)
      .send({
        claimToken,
        nodeId,
        result,
      })
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/complete`)
      .send({
        claimToken,
        nodeId: otherNodeId,
        result,
      })
      .expect(HttpStatus.CONFLICT)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: jobId,
      },
    })

    expect(persisted?.status).toBe(ExecutionJobStatus.COMPLETED)
  })

  it('rejects repeated completion using another claim token', async () => {
    const { claimToken, jobId, nodeId } = await createRunningJob()
    const result = agentExecuteResult(jobId)

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/complete`)
      .send({
        claimToken,
        nodeId,
        result,
      })
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/complete`)
      .send({
        claimToken: randomUUID(),
        nodeId,
        result,
      })
      .expect(HttpStatus.CONFLICT)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: jobId,
      },
    })

    expect(persisted?.status).toBe(ExecutionJobStatus.COMPLETED)
  })

  it('rejects completing an already failed attempt', async () => {
    const { claimToken, jobId, nodeId } = await createRunningJob()

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/fail`)
      .send({
        claimToken,
        failure: agentFailure,
        nodeId,
      })
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/complete`)
      .send({
        claimToken,
        nodeId,
        result: agentExecuteResult(jobId),
      })
      .expect(HttpStatus.CONFLICT)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: jobId,
      },
    })

    expect(persisted?.status).toBe(ExecutionJobStatus.FAILED)
  })

  it('rejects failing an already completed attempt', async () => {
    const { claimToken, jobId, nodeId } = await createRunningJob()

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${jobId}/complete`)
      .send({
        claimToken,
        nodeId,
        result: agentExecuteResult(jobId),
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
  })
})
