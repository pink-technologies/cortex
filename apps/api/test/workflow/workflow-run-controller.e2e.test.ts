// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { randomUUID } from 'node:crypto'
import { ValidationPipe, type INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../../src/app.module'
import { Database } from '../../src/infraestructure/database'
import { ExecutionJobStatus } from '../../src/execution/datatypes/execution-job-status'
import { ExecutionJobService } from '../../src/execution/execution-job.service'
import { WorkflowOrchestrator, issueImplementFlow } from '../../src/workflow'
import {
  issueImplementFlowInput,
  issueImplementResultForKind,
  repositoryReviewJobResult,
} from './issue-implement-fixtures'
describe('workflow-run controller (e2e)', () => {
  let app: INestApplication
  let database: Database
  let executionJobService: ExecutionJobService
  let orchestrator: WorkflowOrchestrator

  const createdRunIds: string[] = []
  const operatorToken = `workflow-operator-e2e:${randomUUID()}`

  beforeAll(async () => {
    process.env.NODE_ENV ??= 'development'
    process.env.WORKFLOW_OPERATOR_TOKEN = operatorToken

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
    executionJobService = app.get(ExecutionJobService)
    orchestrator = app.get(WorkflowOrchestrator)
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
    await app.close()
  })

  async function completeJob(jobId: string, result: unknown): Promise<void> {
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

    await executionJobService.complete(jobId, { claimToken, nodeId, result })
  }

  /**
   * Drives an issue-implement run through its three JOB steps so the run
   * parks on the trailing approval step.
   */
  async function startRunParkedOnApproval(issueKey: string): Promise<{
    runId: string
    stepId: string
  }> {
    const { job, run } = await orchestrator.start({
      definitionKey: issueImplementFlow.key,
      input: issueImplementFlowInput(issueKey),
      triggerIdentifier: `workflow-run-e2e:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    let currentJob: { id: string; kind: string } | undefined = job

    while (currentJob) {
      await completeJob(currentJob.id, issueImplementResultForKind(currentJob.kind, issueKey))

      const nextJob = await database.executionJob.findFirst({
        where: {
          runId: run.id,
          status: ExecutionJobStatus.QUEUED,
        },
      })

      currentJob = nextJob ?? undefined
    }

    const parked = await database.workflowRun.findUniqueOrThrow({
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

    return {
      runId: run.id,
      stepId: parked.steps[3]!.id,
    }
  }

  it('returns a parked run with ordered step progress on get', async () => {
    const { runId } = await startRunParkedOnApproval('JC-30')

    const response = await request(app.getHttpServer()).get(`/api/workflow-runs/${runId}`).expect(200)

    expect(response.body.id).toBe(runId)
    expect(response.body.definitionKey).toBe(issueImplementFlow.key)
    expect(response.body.definitionVersion).toBe(1)
    expect(response.body.status).toBe('AWAITING_APPROVAL')
    expect(response.body.steps.map((step: { key: string }) => step.key)).toEqual([
      'triage',
      'implement',
      'review',
      'approval',
    ])
    expect(response.body.steps[3].status).toBe('AWAITING_APPROVAL')
  })

  it('returns 404 for an unknown run on get', async () => {
    await request(app.getHttpServer()).get(`/api/workflow-runs/${randomUUID()}`).expect(404)
  })

  it('approves a parked run and returns the completed run', async () => {
    const { runId, stepId } = await startRunParkedOnApproval('JC-31')

    const response = await request(app.getHttpServer())
      .post(`/api/workflow-runs/${runId}/approve`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        actorId: 'operator-e2e',
        decisionId: randomUUID(),
        stepId,
      })
      .expect(200)

    expect(response.body.status).toBe('COMPLETED')
    expect(response.body.completedAt).toEqual(expect.any(String))
    expect(response.body.result).toEqual(repositoryReviewJobResult())
    expect(response.body.steps.map((step: { status: string }) => step.status)).toEqual([
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
    ])
  })

  it('rejects a parked run and returns the failed run', async () => {
    const { runId, stepId } = await startRunParkedOnApproval('JC-32')

    const response = await request(app.getHttpServer())
      .post(`/api/workflow-runs/${runId}/reject`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        actorId: 'operator-e2e',
        decisionId: randomUUID(),
        stepId,
      })
      .expect(200)

    expect(response.body.status).toBe('FAILED')
    expect(response.body.failedAt).toEqual(expect.any(String))
    expect(response.body.failure).toEqual({
      code: 'WORKFLOW_APPROVAL_REJECTED',
      message: 'Approval step approval was rejected',
    })
    expect(response.body.steps[3].status).toBe('FAILED')
  })

  it('returns 409 when reject targets an already-approved step', async () => {
    const { runId, stepId } = await startRunParkedOnApproval('JC-33')
    const approveDecisionId = randomUUID()

    await request(app.getHttpServer())
      .post(`/api/workflow-runs/${runId}/approve`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        actorId: 'operator-e2e',
        decisionId: approveDecisionId,
        stepId,
      })
      .expect(200)

    const response = await request(app.getHttpServer())
      .post(`/api/workflow-runs/${runId}/reject`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        actorId: 'operator-e2e',
        decisionId: randomUUID(),
        stepId,
      })
      .expect(409)

    expect(response.body.code).toBe('WORKFLOW_APPROVAL_ERROR')
  })

  it('returns 404 for an unknown run on approve and reject', async () => {
    await request(app.getHttpServer())
      .post(`/api/workflow-runs/${randomUUID()}/approve`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        actorId: 'operator-e2e',
        decisionId: randomUUID(),
        stepId: randomUUID(),
      })
      .expect(404)

    await request(app.getHttpServer())
      .post(`/api/workflow-runs/${randomUUID()}/reject`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        actorId: 'operator-e2e',
        decisionId: randomUUID(),
        stepId: randomUUID(),
      })
      .expect(404)
  })

  it('returns 401 on mutating endpoints without a valid operator token', async () => {
    const { runId, stepId } = await startRunParkedOnApproval('JC-34')

    await request(app.getHttpServer())
      .post(`/api/workflow-runs/${runId}/approve`)
      .send({
        actorId: 'operator-e2e',
        decisionId: randomUUID(),
        stepId,
      })
      .expect(401)

    await request(app.getHttpServer())
      .post(`/api/workflow-runs/${runId}/reject`)
      .set('Authorization', 'Bearer wrong-token')
      .send({
        actorId: 'operator-e2e',
        decisionId: randomUUID(),
        stepId,
      })
      .expect(401)

    await request(app.getHttpServer())
      .post(`/api/workflow-runs/${runId}/cancel`)
      .set('Authorization', `Basic ${operatorToken}`)
      .expect(401)

    const untouched = await request(app.getHttpServer()).get(`/api/workflow-runs/${runId}`).expect(200)
    expect(untouched.body.status).toBe('AWAITING_APPROVAL')
  })

  it('lists runs filtered by status and definition key with paging metadata', async () => {
    const { runId } = await startRunParkedOnApproval('JC-35')

    const response = await request(app.getHttpServer())
      .get('/api/workflow-runs')
      .query({
        definitionKey: issueImplementFlow.key,
        limit: 100,
        status: 'AWAITING_APPROVAL',
      })
      .expect(200)

    expect(response.body.limit).toBe(100)
    expect(response.body.page).toBe(1)
    expect(response.body.total).toBeGreaterThanOrEqual(1)

    const listed = response.body.items.find((item: { id: string }) => item.id === runId)
    expect(listed).toBeDefined()
    expect(listed.status).toBe('AWAITING_APPROVAL')
    expect(listed.definitionKey).toBe(issueImplementFlow.key)
    expect(listed.steps).toHaveLength(4)
  })

  it('rejects unknown listing query parameters', async () => {
    await request(app.getHttpServer()).get('/api/workflow-runs').query({ unexpected: 'value' }).expect(400)
  })

  it('cancels a parked run and returns 409 for a second cancellation', async () => {
    const { runId } = await startRunParkedOnApproval('JC-36')

    const response = await request(app.getHttpServer())
      .post(`/api/workflow-runs/${runId}/cancel`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200)

    expect(response.body.status).toBe('CANCELLED')
    expect(response.body.steps[3].status).toBe('CANCELLED')

    const conflict = await request(app.getHttpServer())
      .post(`/api/workflow-runs/${runId}/cancel`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(409)

    expect(conflict.body.code).toBe('WORKFLOW_CANCEL_ERROR')
  })

  it('returns 404 for an unknown run on cancel', async () => {
    await request(app.getHttpServer())
      .post(`/api/workflow-runs/${randomUUID()}/cancel`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(404)
  })
})
