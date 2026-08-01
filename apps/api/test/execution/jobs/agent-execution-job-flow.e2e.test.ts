// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { randomUUID } from 'node:crypto'
import { ValidationPipe, type INestApplication } from '@nestjs/common'
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
  input: 'Reply with exactly: Cortex agent runtime is working.',
  toolNames: [] as string[],
}

/**
 * Builds a register payload for a Node that can claim `agent.execute`.
 */
function makeCompatibleNodeRegistration(
  installationId: string = randomUUID(),
) {
  return {
    architecture: NodeArchitecture.ARM64,
    capabilities: ['os.macos'],
    installationId,
    labels: [] as string[],
    name: `e2e-node-${installationId.slice(0, 8)}`,
    operatingSystem: NodeOperatingSystem.MACOS,
    supportedKinds: ['system.test', AgentExecuteJobKind],
    version: '0.1.0',
  }
}

/**
 * Builds a register payload for a Node that cannot claim `agent.execute`.
 */
function makeUnsupportedNodeRegistration(
  installationId: string = randomUUID(),
) {
  return {
    ...makeCompatibleNodeRegistration(installationId),
    supportedKinds: ['system.test'],
  }
}

/**
 * Builds a valid `agent.execute` completion result for the given job id.
 */
function makeAgentExecuteResult(executionId: string) {
  return {
    executionId,
    iterationCount: 1,
    output: 'Cortex agent runtime is working.',
    usage: {
      inputTokens: 10,
      outputTokens: 4,
      totalTokens: 14,
    },
  }
}

describe('agent.execute job flow (e2e)', () => {
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

    // Clear leftover queued agent.execute jobs so claim assertions stay deterministic.
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
      .post('/api/internal/execution-jobs/agent-executions')
      .send({
        payload: agentExecutePayload,
        priority: 0,
      })
      .expect(201)

    createdJobIds.push(response.body.id)

    return response.body as {
      id: string
      kind: string
      status: string
      payload: unknown
    }
  }

  /**
   * Registers a Node and tracks it for cleanup.
   */
  async function registerNode(
    body: ReturnType<typeof makeCompatibleNodeRegistration>,
  ) {
    const response = await request(app.getHttpServer())
      .post('/api/internal/nodes/register')
      .send(body)
      .expect(201)

    createdNodeIds.push(response.body.nodeId)

    return response.body as {
      heartbeatIntervalSeconds: number
      nodeId: string
    }
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
      .expect(200)

    return response.body as {
      job: null | {
        id: string
        claimToken: string | null
        kind: string
        status: string
        payload: unknown
      }
    }
  }

  it('creates, claims, completes, and persists an agent.execute job', async () => {
    const created = await createAgentExecutionJob()

    expect(created).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        kind: AgentExecuteJobKind,
        status: ExecutionJobStatus.QUEUED,
        payload: agentExecutePayload,
      }),
    )

    const registration = await registerNode(makeCompatibleNodeRegistration())
    const claim = await claimJob(registration.nodeId)

    expect(claim.job).toEqual(
      expect.objectContaining({
        id: created.id,
        claimToken: expect.any(String),
        kind: AgentExecuteJobKind,
        status: ExecutionJobStatus.RUNNING,
        payload: agentExecutePayload,
      }),
    )

    const result = makeAgentExecuteResult(created.id)

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${created.id}/complete`)
      .send({
        claimToken: claim.job!.claimToken,
        nodeId: registration.nodeId,
        result,
      })
      .expect(204)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: created.id,
      },
    })

    expect(persisted).toEqual(
      expect.objectContaining({
        id: created.id,
        kind: AgentExecuteJobKind,
        status: ExecutionJobStatus.COMPLETED,
        completedAt: expect.any(Date),
        result,
      }),
    )
  })

  it('accepts completing the same job twice from the same claim', async () => {
    const created = await createAgentExecutionJob()
    const registration = await registerNode(makeCompatibleNodeRegistration())
    const claim = await claimJob(registration.nodeId)

    expect(claim.job?.id).toBe(created.id)

    const result = makeAgentExecuteResult(created.id)
    const completeBody = {
      claimToken: claim.job!.claimToken,
      nodeId: registration.nodeId,
      result,
    }

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${created.id}/complete`)
      .send(completeBody)
      .expect(204)

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${created.id}/complete`)
      .send(completeBody)
      .expect(204)
  })

  it('rejects completing a queued job', async () => {
    const created = await createAgentExecutionJob()

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${created.id}/complete`)
      .send({
        claimToken: randomUUID(),
        nodeId: randomUUID(),
        result: makeAgentExecuteResult(created.id),
      })
      .expect(409)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: created.id,
      },
    })

    expect(persisted?.status).toBe(ExecutionJobStatus.QUEUED)
    expect(persisted?.completedAt).toBeNull()
  })

  it('rejects an invalid agent execution result', async () => {
    const created = await createAgentExecutionJob()
    const registration = await registerNode(makeCompatibleNodeRegistration())
    const claim = await claimJob(registration.nodeId)

    expect(claim.job?.id).toBe(created.id)

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${created.id}/complete`)
      .send({
        claimToken: claim.job!.claimToken,
        nodeId: registration.nodeId,
        result: {
          executionId: created.id,
          iterationCount: 0,
          output: 'invalid',
          usage: {
            inputTokens: 1,
            outputTokens: 1,
            totalTokens: 2,
          },
        },
      })
      .expect(400)

    const persisted = await database.executionJob.findUnique({
      where: {
        id: created.id,
      },
    })

    expect(persisted?.status).toBe(ExecutionJobStatus.RUNNING)
  })

  it('does not claim agent.execute from an unsupported Node', async () => {
    const created = await createAgentExecutionJob()
    const registration = await registerNode(makeUnsupportedNodeRegistration())
    const claim = await claimJob(registration.nodeId)

    expect(claim).toEqual({
      job: null,
    })

    const persisted = await database.executionJob.findUnique({
      where: {
        id: created.id,
      },
    })

    expect(persisted?.status).toBe(ExecutionJobStatus.QUEUED)
  })
})
