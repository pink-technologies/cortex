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
import { IssueImplementFlowDefinitionKey, WorkflowOrchestrator } from '../../src/workflow'

describe('workflow-run controller (e2e)', () => {
  let app: INestApplication
  let database: Database
  let executionJobService: ExecutionJobService
  let orchestrator: WorkflowOrchestrator

  const createdRunIds: string[] = []

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

  async function completeJob(jobId: string): Promise<void> {
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

    await executionJobService.complete(jobId, { claimToken, nodeId })
  }

  /**
   * Drives an issue-implement run through its three JOB steps so the run
   * parks on the trailing approval step.
   */
  async function startRunParkedOnApproval(input: unknown): Promise<string> {
    const { job, run } = await orchestrator.start({
      definitionKey: IssueImplementFlowDefinitionKey,
      input,
      triggerIdentifier: `workflow-run-e2e:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    let currentJobId: string | undefined = job.id

    while (currentJobId) {
      await completeJob(currentJobId)

      const nextJob = await database.executionJob.findFirst({
        where: {
          runId: run.id,
          status: ExecutionJobStatus.QUEUED,
        },
      })

      currentJobId = nextJob?.id
    }

    return run.id
  }

  it('returns a parked run with ordered step progress on get', async () => {
    const runId = await startRunParkedOnApproval({ issueKey: 'JC-30' })

    const response = await request(app.getHttpServer())
      .get(`/api/workflow-runs/${runId}`)
      .expect(200)

    expect(response.body.id).toBe(runId)
    expect(response.body.definitionKey).toBe(IssueImplementFlowDefinitionKey)
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
    await request(app.getHttpServer())
      .get(`/api/workflow-runs/${randomUUID()}`)
      .expect(404)
  })

  it('approves a parked run and returns the completed run', async () => {
    const input = { issueKey: 'JC-31' }
    const runId = await startRunParkedOnApproval(input)

    const response = await request(app.getHttpServer())
      .post(`/api/workflow-runs/${runId}/approve`)
      .expect(200)

    expect(response.body.status).toBe('COMPLETED')
    expect(response.body.completedAt).toEqual(expect.any(String))
    expect(response.body.result).toEqual(input)
    expect(response.body.steps.map((step: { status: string }) => step.status)).toEqual([
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
    ])
  })

  it('rejects a parked run and returns the failed run', async () => {
    const runId = await startRunParkedOnApproval({ issueKey: 'JC-32' })

    const response = await request(app.getHttpServer())
      .post(`/api/workflow-runs/${runId}/reject`)
      .expect(200)

    expect(response.body.status).toBe('FAILED')
    expect(response.body.failedAt).toEqual(expect.any(String))
    expect(response.body.failure).toEqual({
      code: 'WORKFLOW_APPROVAL_REJECTED',
      message: 'Approval step approval was rejected',
    })
    expect(response.body.steps[3].status).toBe('FAILED')
  })

  it('returns 409 when the run has no step awaiting approval', async () => {
    const runId = await startRunParkedOnApproval({ issueKey: 'JC-33' })

    await request(app.getHttpServer())
      .post(`/api/workflow-runs/${runId}/approve`)
      .expect(200)

    const response = await request(app.getHttpServer())
      .post(`/api/workflow-runs/${runId}/reject`)
      .expect(409)

    expect(response.body.code).toBe('WORKFLOW_APPROVAL_ERROR')
  })

  it('returns 404 for an unknown run on approve and reject', async () => {
    await request(app.getHttpServer())
      .post(`/api/workflow-runs/${randomUUID()}/approve`)
      .expect(404)

    await request(app.getHttpServer())
      .post(`/api/workflow-runs/${randomUUID()}/reject`)
      .expect(404)
  })
})
