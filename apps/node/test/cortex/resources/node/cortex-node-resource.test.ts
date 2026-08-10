// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { RegisterNodeRequest } from '@cortex/protocol'
import type { NodeConfiguration } from '../../../../src/configuration/node-configuration'
import { CortexClient, CortexNodeResource } from '../../../../src/cortex'

const configuration = {
  apiBaseURL: 'https://api.cortex.example',
} as unknown as NodeConfiguration

const registerRequest: RegisterNodeRequest = {
  architecture: 'ARM64',
  capabilities: ['agent.execute'],
  installationId: '11111111-1111-4111-8111-111111111111',
  labels: [],
  name: 'worker',
  operatingSystem: 'MACOS',
  supportedKinds: ['agent.execute'],
  version: '1.0.0',
}

/**
 * Builds a resource bound to a test Cortex client.
 */
function resource(): CortexNodeResource {
  return new CortexNodeResource(new CortexClient(configuration))
}

describe('CortexNodeResource.register', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('registers the node and returns the validated response', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          heartbeatIntervalSeconds: 30,
          nodeId: '22222222-2222-4222-8222-222222222222',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    )

    const response = await resource().register(registerRequest)

    expect(response).toEqual({
      heartbeatIntervalSeconds: 30,
      nodeId: '22222222-2222-4222-8222-222222222222',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cortex.example/internal/nodes/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(registerRequest),
      }),
    )
  })

  it('throws CortexNodeRegisterError when registration fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('denied', { status: 403 }))

    await expect(resource().register(registerRequest)).rejects.toMatchObject({
      code: 'CORTEX_NODE_REGISTER_ERROR',
      name: 'CortexNodeRegisterError',
    })
  })

  it('rethrows cancellation without wrapping as CortexNodeRegisterError', async () => {
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

    const pending = resource().register(registerRequest, controller.signal)
    controller.abort()

    await expect(pending).rejects.not.toMatchObject({
      code: 'CORTEX_NODE_REGISTER_ERROR',
    })
  })
})

describe('CortexNodeResource.heartbeat', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sends a heartbeat for the node', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 204 }),
    )

    await resource().heartbeat('node-1')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cortex.example/internal/nodes/node-1/heartbeat',
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })

  it('throws CortexNodeHeartbeatError when the heartbeat fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('down', { status: 502 }))

    await expect(resource().heartbeat('node-1')).rejects.toMatchObject({
      code: 'CORTEX_NODE_HEARTBEAT_ERROR',
      name: 'CortexNodeHeartbeatError',
      nodeId: 'node-1',
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

    const pending = resource().heartbeat('node-1', controller.signal)
    controller.abort()

    await expect(pending).rejects.not.toMatchObject({
      code: 'CORTEX_NODE_HEARTBEAT_ERROR',
    })
  })
})
