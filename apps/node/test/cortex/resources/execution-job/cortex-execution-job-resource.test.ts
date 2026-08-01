// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type {
  AgentExecuteJobResult,
  CompleteExecutionJobRequest,
  FailExecutionJobRequest,
} from '@cortex/protocol'
import type { NodeConfiguration } from '../../../../src/configuration/node-configuration'
import { CortexClient, CortexExecutionJobResource } from '../../../../src/cortex'

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
 * Creates a valid completion request for resource tests.
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
 * Creates a valid failure request for resource tests.
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

/**
 * Builds a resource bound to a test Cortex client.
 */
function resource(): CortexExecutionJobResource {
  return new CortexExecutionJobResource(new CortexClient(configuration))
}

describe('CortexExecutionJobResource.claimNextAvailable', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('claims the next available execution job', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ job: null }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const response = await resource().claimNextAvailable(nodeId)

    expect(response).toEqual({ job: null })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cortex.example/internal/execution-jobs/claim',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ nodeId }),
      }),
    )
  })

  it('throws CortexExecutionJobClaimError when the claim fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('unavailable', { status: 503 }))

    await expect(resource().claimNextAvailable(nodeId)).rejects.toMatchObject({
      code: 'CORTEX_EXECUTION_JOB_CLAIM_ERROR',
      name: 'CortexExecutionJobClaimError',
      nodeId,
    })
  })

  it('rethrows cancellation without wrapping', async () => {
    const controller = new AbortController()

    jest.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal
        if (!signal) {
          reject(new Error('missing signal'))
          return
        }

        signal.addEventListener('abort', () => {
          reject(signal.reason ?? new Error('aborted'))
        })
      })
    })

    const pending = resource().claimNextAvailable(nodeId, controller.signal)
    controller.abort()

    await expect(pending).rejects.not.toMatchObject({
      code: 'CORTEX_EXECUTION_JOB_CLAIM_ERROR',
    })
  })
})

describe('CortexExecutionJobResource.complete', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sends the claim token, node id, and result when completing a job', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 204 }),
    )
    const request = makeCompleteRequest()

    await resource().complete('job-1', request)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cortex.example/internal/execution-jobs/job-1/complete',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(request),
      }),
    )
  })

  it('completes a job without a result', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 204 }),
    )
    const request = makeCompleteRequest({ result: undefined })

    await resource().complete('job-1', request)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cortex.example/internal/execution-jobs/job-1/complete',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ claimToken, nodeId }),
      }),
    )
  })

  it('validates the completion request before sending it', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
    const request = makeCompleteRequest({
      result: {
        ...agentResult,
        iterationCount: 0,
      },
    })

    await expect(resource().complete('job-1', request)).rejects.toMatchObject({
      code: 'CORTEX_EXECUTION_JOB_COMPLETE_ERROR',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forwards the cancellation signal', async () => {
    const signal = AbortSignal.abort()
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 204 }),
    )

    await expect(resource().complete('job-1', makeCompleteRequest(), signal)).rejects.toBeDefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws CortexExecutionJobCompleteError when the endpoint fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('unavailable', { status: 503 }),
    )

    await expect(resource().complete('job-1', makeCompleteRequest())).rejects.toMatchObject({
      code: 'CORTEX_EXECUTION_JOB_COMPLETE_ERROR',
      jobId: 'job-1',
      name: 'CortexExecutionJobCompleteError',
    })
  })

  it('rethrows cancellation without wrapping as CortexExecutionJobCompleteError', async () => {
    const controller = new AbortController()

    jest.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal
        if (!signal) {
          reject(new Error('missing signal'))
          return
        }

        signal.addEventListener('abort', () => {
          reject(signal.reason ?? new Error('aborted'))
        })
      })
    })

    const pending = resource().complete('job-1', makeCompleteRequest(), controller.signal)
    controller.abort()

    await expect(pending).rejects.not.toMatchObject({
      code: 'CORTEX_EXECUTION_JOB_COMPLETE_ERROR',
    })
  })
})

describe('CortexExecutionJobResource.fail', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('reports a failed execution job', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 204 }),
    )
    const request = makeFailRequest()

    await resource().fail('job-1', request)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cortex.example/internal/execution-jobs/job-1/fail',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(request),
      }),
    )
  })

  it('validates the failure request before sending it', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
    const request = makeFailRequest({
      failure: {
        code: '',
        message: '',
      },
    })

    await expect(resource().fail('job-1', request)).rejects.toMatchObject({
      code: 'CORTEX_EXECUTION_JOB_FAIL_ERROR',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws CortexExecutionJobFailError when the endpoint fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('boom', { status: 500 }))

    await expect(resource().fail('job-1', makeFailRequest())).rejects.toMatchObject({
      code: 'CORTEX_EXECUTION_JOB_FAIL_ERROR',
      jobId: 'job-1',
      name: 'CortexExecutionJobFailError',
    })
  })

  it('rethrows cancellation without wrapping as CortexExecutionJobFailError', async () => {
    const controller = new AbortController()

    jest.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal
        if (!signal) {
          reject(new Error('missing signal'))
          return
        }

        signal.addEventListener('abort', () => {
          reject(signal.reason ?? new Error('aborted'))
        })
      })
    })

    const pending = resource().fail('job-1', makeFailRequest(), controller.signal)
    controller.abort()

    await expect(pending).rejects.not.toMatchObject({
      code: 'CORTEX_EXECUTION_JOB_FAIL_ERROR',
    })
  })
})
