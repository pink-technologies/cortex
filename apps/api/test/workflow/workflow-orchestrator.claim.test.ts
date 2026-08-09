// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { randomUUID } from 'node:crypto'
import { ConfigModule } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { JiraTriageJobKind, NodeArchitecture, NodeOperatingSystem } from '@cortex/protocol'
import { Database, DatabaseModule } from '../../src/infraestructure/database'
import { ExecutionJobStatus } from '../../src/execution/datatypes/execution-job-status'
import { ExecutionJobService } from '../../src/execution/execution-job.service'
import { ExecutionModule } from '../../src/execution/execution.module'
import { NodesService } from '../../src/nodes'
import {
  WorkflowModule,
  WorkflowOrchestrator,
  WorkflowRunStatus,
  WorkflowStepStatus,
  jiraTriageFlow,
} from '../../src/workflow'

describe('WorkflowOrchestrator claim', () => {
  let database: Database
  let executionJobService: ExecutionJobService
  let moduleRef: TestingModule
  let nodesService: NodesService
  let orchestrator: WorkflowOrchestrator

  const createdNodeIds: string[] = []
  const createdRunIds: string[] = []

  beforeAll(async () => {
    process.env.NODE_ENV ??= 'development'

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: `env/.env.${process.env.NODE_ENV ?? 'development'}`,
          isGlobal: true,
        }),
        DatabaseModule,
        ExecutionModule,
        WorkflowModule,
      ],
    }).compile()

    await moduleRef.init()

    database = moduleRef.get(Database)
    executionJobService = moduleRef.get(ExecutionJobService)
    nodesService = moduleRef.get(NodesService)
    orchestrator = moduleRef.get(WorkflowOrchestrator)
  })

  afterEach(async () => {
    if (createdRunIds.length > 0) {
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
    await database.$disconnect()
  })

  async function registerClaimNode() {
    const installationId = randomUUID()
    const node = await nodesService.register({
      architecture: NodeArchitecture.ARM64,
      capabilities: [],
      installationId,
      labels: [],
      name: `workflow-claim-${installationId.slice(0, 8)}`,
      operatingSystem: NodeOperatingSystem.MACOS,
      supportedKinds: [JiraTriageJobKind],
      version: '0.1.0',
    })
    createdNodeIds.push(node.id)
    return node
  }

  it('moves the linked step from QUEUED to RUNNING when its job is claimed', async () => {
    await database.executionJob.deleteMany({
      where: {
        kind: JiraTriageJobKind,
        status: ExecutionJobStatus.QUEUED,
      },
    })

    const { job, run } = await orchestrator.start({
      definitionKey: jiraTriageFlow.key,
      input: { issueKey: 'JC-claim-1' },
      triggerIdentifier: `workflow-claim:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    expect(run.status).toBe(WorkflowRunStatus.RUNNING)
    expect(run.steps[0]?.status).toBe(WorkflowStepStatus.QUEUED)
    expect(job.status).toBe(ExecutionJobStatus.QUEUED)

    await database.executionJob.update({
      where: {
        id: job.id,
      },
      data: {
        priority: 1_000_000,
      },
    })

    const node = await registerClaimNode()
    const claimed = await executionJobService.claimNextAvailable(node.id)

    expect(claimed).not.toBeNull()
    expect(claimed?.id).toBe(job.id)
    expect(claimed?.status).toBe(ExecutionJobStatus.RUNNING)

    const updated = await database.workflowRun.findUnique({
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

    expect(updated?.steps[0]?.status).toBe(WorkflowStepStatus.RUNNING)
  })

  it('is idempotent when onJobClaimed runs after the step already left QUEUED', async () => {
    await database.executionJob.deleteMany({
      where: {
        kind: JiraTriageJobKind,
        status: ExecutionJobStatus.QUEUED,
      },
    })

    const { job, run } = await orchestrator.start({
      definitionKey: jiraTriageFlow.key,
      input: { issueKey: 'JC-claim-2' },
      triggerIdentifier: `workflow-claim-idempotent:${randomUUID()}`,
    })
    createdRunIds.push(run.id)

    await database.executionJob.update({
      where: {
        id: job.id,
      },
      data: {
        priority: 1_000_000,
      },
    })

    const node = await registerClaimNode()
    const claimed = await executionJobService.claimNextAvailable(node.id)

    expect(claimed).not.toBeNull()
    expect(claimed?.id).toBe(job.id)

    await expect(orchestrator.onJobClaimed(job.id)).resolves.toBeUndefined()

    const updated = await database.workflowStep.findUnique({
      where: {
        id: run.steps[0]!.id,
      },
    })

    expect(updated?.status).toBe(WorkflowStepStatus.RUNNING)
  })

  it('no-ops onJobClaimed for jobs that are not linked to a workflow step', async () => {
    const job = await executionJobService.create({
      kind: JiraTriageJobKind,
      payload: { issueKey: 'JC-unlinked' },
      payloadVersion: 1,
      policy: {},
      priority: 0,
      requirements: {
        allOf: [],
      },
    })

    await database.executionJob.update({
      where: {
        id: job.id,
      },
      data: {
        claimToken: randomUUID(),
        claimedByNodeId: `node-${randomUUID()}`,
        startedAt: new Date(),
        status: ExecutionJobStatus.RUNNING,
      },
    })

    await expect(orchestrator.onJobClaimed(job.id)).resolves.toBeUndefined()

    await database.executionJob.delete({
      where: {
        id: job.id,
      },
    })
  })
})
