// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod } from '@cortex/networking'
import { GitHubClient } from '../../src/github'

describe('GitHubClient', () => {
  const connection = {
    id: 'github-main',
    provider: 'github' as const,
    token: 'ghp_test',
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('resolves relative paths against the default API host with auth headers', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ number: 1 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const client = new GitHubClient(connection)
    const payload = await client.request<{ number: number }>('/repos/acme/app/pulls/1', {
      method: HTTPMethod.GET,
      signal: new AbortController().signal,
    })

    expect(payload).toEqual({ number: 1 })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme/app/pulls/1',
      expect.objectContaining({
        headers: expect.objectContaining({
          accept: 'application/vnd.github+json',
          authorization: 'Bearer ghp_test',
          'x-github-api-version': '2022-11-28',
        }),
        method: HTTPMethod.GET,
      }),
    )
  })

  it('joins a custom apiBaseUrl and normalizes trailing slashes', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const client = new GitHubClient({
      ...connection,
      apiBaseUrl: 'https://github.example.com/api/v3/',
    })
    await client.request('repos/acme/app/pulls')

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://github.example.com/api/v3/repos/acme/app/pulls')
  })

  it('throws when the response fails validation', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('missing', { status: 404 }))

    const client = new GitHubClient(connection)

    await expect(client.request('/repos/acme/app/pulls/404')).rejects.toBeDefined()
  })
})
