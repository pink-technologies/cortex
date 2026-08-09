// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { BadRequestException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { AgentExecuteJobKind, CreateAgentExecuteJobRequestSchema } from '@cortex/protocol'
import { ZodValidationPipe } from '@/http/pipes/zod-validation.pipe'
import { agentExecuteFlow } from '@/workflow/definitions'
import { WorkflowOrchestrator } from '@/workflow/orchestrator'
import { ExecutionJobStatus } from '../../../src/execution/datatypes/execution-job-status'
import { ExecutionJobController } from '../../../src/execution/controller/execution-job.controller'
import { ExecutionJobService } from '../../../src/execution/execution-job.service'
import { ExecutionJob } from '../../../src/execution/models/execution-job'
const agentExecutePayload = {
  agentId: 'assistant',
  input: 'Reply with hello.',
  toolNames: [] as string[],
}

const expectedStartParameters = {
  definitionKey: agentExecuteFlow.key,
  input: {
    agentId: 'assistant',
    input: 'Reply with hello.',
    toolNames: [],
  },
  priority: 0,
}

/**
 * Creates a domain execution job returned by the orchestrator double.
 */
function makeDomainExecutionJob(
  overrides: Partial<{
    kind: string
    payload: unknown
    priority: number
  }> = {},
): ExecutionJob {
  const now = new Date('2026-07-30T12:00:00.000Z')

  return new ExecutionJob(
    'execution-job-1',
    now,
    now,
    overrides.kind ?? AgentExecuteJobKind,
    1,
    overrides.priority ?? 0,
    overrides.payload ?? agentExecutePayload,
    1,
    {},
    { allOf: [] },
    ExecutionJobStatus.QUEUED,
    now,
  )
}

/**
 * Validates a request body the same way the controller route pipe does.
 */
function parseCreateRequest(body: unknown) {
  return new ZodValidationPipe(CreateAgentExecuteJobRequestSchema).transform(body)
}

describe('ExecutionJobController', () => {
  let controller: ExecutionJobController
  let start: jest.Mock

  beforeEach(async () => {
    start = jest.fn()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecutionJobController],
      providers: [
        {
          provide: ExecutionJobService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: WorkflowOrchestrator,
          useValue: {
            start,
          },
        },
      ],
    }).compile()

    controller = module.get(ExecutionJobController)
  })

  describe('createAgentExecution', () => {
    it('starts an agent.execute.flow run and returns the first-step job', async () => {
      const request = parseCreateRequest({
        payload: {
          agentId: 'assistant',
          input: 'Reply with hello.',
        },
      })
      const domainJob = makeDomainExecutionJob()

      start.mockResolvedValue({ job: domainJob, run: { id: 'run-1' } })

      const response = await controller.createAgentExecution(request)

      expect(start).toHaveBeenCalledWith(expectedStartParameters)

      expect(response).toEqual({
        id: 'execution-job-1',
        claimToken: null,
        createdAt: '2026-07-30T12:00:00.000Z',
        kind: AgentExecuteJobKind,
        payload: agentExecutePayload,
        payloadVersion: 1,
        priority: 0,
        policy: {
          maximumDurationSeconds: undefined,
          preserveWorkspaceOnFailure: undefined,
        },
        runId: null,
        status: 'QUEUED',
        updatedAt: '2026-07-30T12:00:00.000Z',
      })
    })

    it('uses the agent.execute.flow definition', async () => {
      const request = parseCreateRequest({
        payload: {
          agentId: 'assistant',
          input: 'Reply with hello.',
        },
      })

      start.mockResolvedValue({ job: makeDomainExecutionJob(), run: { id: 'run-1' } })

      await controller.createAgentExecution(request)

      expect(start).toHaveBeenCalledWith(
        expect.objectContaining({
          definitionKey: agentExecuteFlow.key,
        }),
      )
      expect(agentExecuteFlow.key).toBe('agent.execute.flow')
    })

    it('forwards the payload and priority as run input', async () => {
      const request = parseCreateRequest({
        payload: {
          agentId: 'assistant',
          input: 'Reply with hello.',
        },
      })

      start.mockResolvedValue({ job: makeDomainExecutionJob(), run: { id: 'run-1' } })

      await controller.createAgentExecution(request)

      expect(start).toHaveBeenCalledWith(expectedStartParameters)
    })

    it('rejects an invalid agent execution payload', () => {
      expect(() =>
        parseCreateRequest({
          payload: {
            agentId: 'assistant',
            input: '',
          },
        }),
      ).toThrow(BadRequestException)
    })

    it('applies the default priority when omitted', async () => {
      const request = parseCreateRequest({
        payload: {
          agentId: 'assistant',
          input: 'Reply with hello.',
        },
      })

      start.mockResolvedValue({ job: makeDomainExecutionJob(), run: { id: 'run-1' } })

      await controller.createAgentExecution(request)

      expect(request.priority).toBe(0)
      expect(start).toHaveBeenCalledWith(expectedStartParameters)
    })
  })
})
