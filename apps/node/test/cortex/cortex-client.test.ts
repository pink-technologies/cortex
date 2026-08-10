// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod } from '@cortex/networking'
import type { NodeConfiguration } from '../../src/configuration/node-configuration'
import { CortexClient, CortexRequest } from '../../src/cortex'

describe('CortexClient', () => {
  const configuration = {
    apiBaseURL: 'https://api.cortex.example/',
  } as unknown as NodeConfiguration

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns a CortexRequest for a relative path', () => {
    const client = new CortexClient(configuration)

    expect(client.request('/internal/nodes/register')).toBeInstanceOf(CortexRequest)
  })

  it('resolves relative paths against the configured API URL', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ job: null }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const client = new CortexClient(configuration)
    const payload = await client
      .request('/internal/execution-jobs/claim', {
        method: HTTPMethod.POST,
      })
      .responseJson<{ job: null }>()

    expect(payload).toEqual({ job: null })
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.cortex.example/internal/execution-jobs/claim',
    )
  })

  it('normalizes paths without a leading slash', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const client = new CortexClient(configuration)
    await client.request('internal/nodes/register').responseJson()

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.cortex.example/internal/nodes/register')
  })

  it('applies Accept and forwards method and signal', async () => {
    const signal = new AbortController().signal
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const client = new CortexClient(configuration)
    await client
      .request('/internal/nodes/register', {
        method: HTTPMethod.POST,
        signal,
      })
      .responseJson()

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cortex.example/internal/nodes/register',
      expect.objectContaining({
        method: HTTPMethod.POST,
        signal,
        headers: expect.objectContaining({
          accept: 'application/json',
        }),
      }),
    )
  })

  it('discards the response body for response()', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    const client = new CortexClient(configuration)
    await expect(
      client.request('/internal/nodes/node-1/heartbeat', { method: HTTPMethod.POST }).response(),
    ).resolves.toBeUndefined()
    await expect(
      client.request('internal/nodes/node-1/heartbeat', { method: HTTPMethod.POST }).response(),
    ).resolves.toBeUndefined()

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.cortex.example/internal/nodes/node-1/heartbeat',
    )
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://api.cortex.example/internal/nodes/node-1/heartbeat',
    )
  })

  it('throws when response() fails validation', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('unavailable', { status: 503 }))

    const client = new CortexClient(configuration)

    await expect(client.request('/internal/nodes/node-1/heartbeat').response()).rejects.toBeDefined()
  })

  it('throws when responseJson() fails validation', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('denied', { status: 403 }))

    const client = new CortexClient(configuration)

    await expect(client.request('/internal/nodes/register').responseJson()).rejects.toBeDefined()
  })
})
