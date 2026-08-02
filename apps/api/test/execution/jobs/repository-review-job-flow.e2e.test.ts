// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { randomUUID } from 'node:crypto'
import { HttpStatus, ValidationPipe, type INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import request from 'supertest'
import {
  NodeArchitecture,
  NodeOperatingSystem,
  RepositoryReviewJobKind,
} from '@cortex/protocol'
import { AppModule } from '../../../src/app.module'
import { Database } from '../../../src/infraestructure/database'
import { ExecutionJobStatus } from '../../../src/execution/datatypes/execution-job-status'

const reviewPayload = {
  change: {
    baseRef: 'main',
    headRef: 'feature/review',
    pullRequestNumber: 42,
  },
  connectionId: 'github-main',
  instructions: 'Focus on correctness.',
  repository: {
    cloneUrl: 'https://github.com/pink-tech/cortex.git',
    name: 'cortex',
    owner: 'pink-tech',
  },
  reviewMode: 'diff' as const,
}

const reviewResult = {
  findings: [
    {
      detail: 'Prefer early return.',
      path: 'src/main.ts',
      severity: 'info' as const,
      startLine: 3,
      title: 'Simplify control flow',
    },
  ],
  reviewMode: 'diff' as const,
  summary: 'One informational finding.',
}

function makeCompatibleNodeRegistration(installationId: string = randomUUID()) {
  return {
    architecture: NodeArchitecture.ARM64,
    capabilities: ['os.macos'],
    installationId,
    labels: [] as string[],
    name: `e2e-node-${installationId.slice(0, 8)}`,
    operatingSystem: NodeOperatingSystem.MACOS,
    supportedKinds: [RepositoryReviewJobKind],
    version: '0.1.0',
  }
}

describe('repository.review job flow (e2e)', () => {
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
        kind: RepositoryReviewJobKind,
        status: ExecutionJobStatus.QUEUED,
      },
    })
  })

  afterEach(async () => {
    if (database && createdJobIds.length > 0) {
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

    if (database && createdNodeIds.length > 0) {
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
    await app?.close()
  })

  async function createRepositoryReviewJob() {
    const response = await request(app.getHttpServer())
      .post('/api/execution-jobs/repository-reviews')
      .send({
        payload: reviewPayload,
        priority: 1,
      })
      .expect(HttpStatus.CREATED)

    createdJobIds.push(response.body.id)

    return response.body
  }

  async function registerNode(body: ReturnType<typeof makeCompatibleNodeRegistration>) {
    const response = await request(app.getHttpServer())
      .post('/api/internal/nodes/register')
      .send(body)
      .expect(HttpStatus.CREATED)

    createdNodeIds.push(response.body.nodeId)

    return response.body
  }

  it('creates a repository.review job and exposes status through get', async () => {
    const created = await createRepositoryReviewJob()

    expect(created).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        kind: RepositoryReviewJobKind,
        runId: expect.any(String),
        status: ExecutionJobStatus.QUEUED,
      }),
    )

    const retrieved = await request(app.getHttpServer())
      .get(`/api/execution-jobs/${created.id}`)
      .expect(HttpStatus.OK)

    expect(retrieved.body).toEqual(
      expect.objectContaining({
        id: created.id,
        kind: RepositoryReviewJobKind,
        result: null,
        runId: created.runId,
        status: ExecutionJobStatus.QUEUED,
      }),
    )
  })

  it('starts a workflow run that the returned runId resolves to', async () => {
    const created = await createRepositoryReviewJob()

    const run = await request(app.getHttpServer())
      .get(`/api/workflow-runs/${created.runId}`)
      .expect(HttpStatus.OK)

    expect(run.body).toEqual(
      expect.objectContaining({
        id: created.runId,
        definitionKey: 'repository.review.flow',
        status: 'RUNNING',
      }),
    )
    expect(run.body.steps).toEqual([
      expect.objectContaining({
        key: 'main',
        status: 'QUEUED',
      }),
    ])
  })

  it('completes a claimed repository.review job and returns the result on get', async () => {
    const created = await createRepositoryReviewJob()
    const registration = await registerNode(makeCompatibleNodeRegistration())

    const claim = await request(app.getHttpServer())
      .post('/api/internal/execution-jobs/claim')
      .send({
        nodeId: registration.nodeId,
      })
      .expect(HttpStatus.OK)

    expect(claim.body.job?.id).toBe(created.id)

    await request(app.getHttpServer())
      .post(`/api/internal/execution-jobs/${created.id}/complete`)
      .send({
        claimToken: claim.body.job.claimToken,
        nodeId: registration.nodeId,
        result: reviewResult,
      })
      .expect(HttpStatus.NO_CONTENT)

    const retrieved = await request(app.getHttpServer())
      .get(`/api/execution-jobs/${created.id}`)
      .expect(HttpStatus.OK)

    expect(retrieved.body).toEqual(
      expect.objectContaining({
        id: created.id,
        kind: RepositoryReviewJobKind,
        result: reviewResult,
        status: ExecutionJobStatus.COMPLETED,
      }),
    )

    const run = await request(app.getHttpServer())
      .get(`/api/workflow-runs/${created.runId}`)
      .expect(HttpStatus.OK)

    expect(run.body).toEqual(
      expect.objectContaining({
        id: created.runId,
        result: reviewResult,
        status: 'COMPLETED',
      }),
    )
  })
})
