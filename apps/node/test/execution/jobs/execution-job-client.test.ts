// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type {
  AgentExecuteJobResult,
  CompleteExecutionJobRequest,
  FailExecutionJobRequest,
} from '@cortex/protocol'
import type { NodeConfiguration } from '../../../src/configuration/node-configuration'
import { ExecutionJobClient } from '../../../src/execution/jobs/execution-job-client'

const claimToken = '22222222-2222-4222-8222-222222222222'
const nodeId = '11111111-1111-4111-8111-111111111111'

const configuration = {
  apiURL: 'https://api.cortex.example',
  nodeId: 'node-1',
  nodeName: 'worker',
  pollingIntervalMilliseconds: 2_000,
  version: '1.0.0',
} as NodeConfiguration

const agentResult: AgentExecuteJobResult = {
  executionId: 'exec-1',
  iterationCount: 2,
  output: 'Done.',
  usage: {
    inputTokens: 10,
    outputTokens: 4,
    totalTokens: 14,
  },
}

/**
 * Creates a valid completion request for client tests.
 */
function makeCompleteRequest(
  overrides: Partial<CompleteExecutionJobRequest> = {},
): CompleteExecutionJobRequest {
  return {
    claimToken,
    nodeId,
    result: agentResult,
    ...overrides,
  }
}

/**
 * Creates a valid failure request for client tests.
 */
function makeFailRequest(
  overrides: Partial<FailExecutionJobRequest> = {},
): FailExecutionJobRequest {
  return {
    claimToken,
    failure: {
      code: 'AGENT_EXECUTION_FAILED',
      message: 'The agent execution failed.',
    },
    nodeId,
    ...overrides,
  }
}

describe('ExecutionJobClient.complete', () => {
  let fetchMock: jest.Mock
  let client: ExecutionJobClient

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
      text: async () => '',
    })
    global.fetch = fetchMock as unknown as typeof fetch
    client = new ExecutionJobClient(configuration)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sends the claim token, node id, and result when completing a job', async () => {
    const request = makeCompleteRequest()

    await client.complete('job-1', request)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cortex.example/internal/execution-jobs/job-1/complete',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }),
    )
  })

  it('completes a job without a result', async () => {
    const request = makeCompleteRequest({ result: undefined })

    await client.complete('job-1', request)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cortex.example/internal/execution-jobs/job-1/complete',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ claimToken, nodeId }),
      }),
    )
  })

  it('validates the completion request before sending it', async () => {
    const request = makeCompleteRequest({
      result: {
        ...agentResult,
        iterationCount: 0,
      },
    })

    await expect(client.complete('job-1', request)).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forwards the cancellation signal', async () => {
    const signal = AbortSignal.abort()

    await client.complete('job-1', makeCompleteRequest(), signal)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cortex.example/internal/execution-jobs/job-1/complete',
      expect.objectContaining({
        signal,
      }),
    )
  })

  it('throws when the completion endpoint fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'unavailable',
      json: async () => ({}),
    })

    await expect(client.complete('job-1', makeCompleteRequest())).rejects.toThrow(
      'Cortex API request failed with status 503: unavailable',
    )
  })
})

describe('ExecutionJobClient.claimNextAvailable', () => {
  let fetchMock: jest.Mock
  let client: ExecutionJobClient

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ job: null }),
      text: async () => '',
    })
    global.fetch = fetchMock as unknown as typeof fetch
    client = new ExecutionJobClient(configuration)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('claims the next available execution job', async () => {
    const response = await client.claimNextAvailable(nodeId)

    expect(response).toEqual({ job: null })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cortex.example/internal/execution-jobs/claim',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ nodeId }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    )
  })
})

describe('ExecutionJobClient.fail', () => {
  let fetchMock: jest.Mock
  let client: ExecutionJobClient

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
      text: async () => '',
    })
    global.fetch = fetchMock as unknown as typeof fetch
    client = new ExecutionJobClient(configuration)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('reports a failed execution job', async () => {
    const request = makeFailRequest()

    await client.fail('job-1', request)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cortex.example/internal/execution-jobs/job-1/fail',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(request),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    )
  })

  it('validates the failure request before sending it', async () => {
    const request = makeFailRequest({
      failure: {
        code: '',
        message: '',
      },
    })

    await expect(client.fail('job-1', request)).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
