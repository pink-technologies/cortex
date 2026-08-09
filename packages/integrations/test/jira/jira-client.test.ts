// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod } from '@cortex/networking'
import { JiraClient } from '../../src/jira'

describe('JiraClient', () => {
  const connection = {
    apiToken: 'token',
    baseUrl: 'https://example.atlassian.net/',
    email: 'bot@example.com',
    id: 'jira-main',
    provider: 'jira' as const,
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('resolves relative paths against the connection base URL with auth headers', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ key: 'JC-1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const client = new JiraClient(connection)
    const payload = await client.request<{ key: string }>('/rest/api/3/issue/JC-1', {
      method: HTTPMethod.GET,
      signal: new AbortController().signal,
    })

    expect(payload).toEqual({ key: 'JC-1' })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.atlassian.net/rest/api/3/issue/JC-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          accept: 'application/json',
          authorization: `Basic ${Buffer.from('bot@example.com:token').toString('base64')}`,
        }),
        method: HTTPMethod.GET,
      }),
    )
  })

  it('normalizes paths without a leading slash', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ accountId: 'a1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const client = new JiraClient(connection)
    await client.request('rest/api/3/myself')

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://example.atlassian.net/rest/api/3/myself')
  })

  it('throws when the response fails validation', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('missing', { status: 404 }))

    const client = new JiraClient(connection)

    await expect(client.request('/rest/api/3/issue/JC-404')).rejects.toBeDefined()
  })
})
