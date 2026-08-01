// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraClient, JiraCommentResource } from '../../../../src/jira'

describe('JiraCommentResource', () => {
  const connection = {
    apiToken: 'token',
    baseUrl: 'https://example.atlassian.net',
    email: 'bot@example.com',
    id: 'jira-main',
    provider: 'jira' as const,
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function resource(): JiraCommentResource {
    return new JiraCommentResource(new JiraClient(connection))
  }

  it('creates comments', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 200 }))

    await resource().create('JC-1', 'hello', new AbortController().signal)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' })
  })

  it('throws when comment serialization fails softly', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('not-json', { status: 200, headers: { 'content-type': 'application/json' } }))

    await expect(resource().create('JC-1', 'hello', new AbortController().signal)).rejects.toMatchObject({
      code: 'JIRA_ADD_COMMENT_ERROR',
      name: 'JiraAddCommentError',
    })
  })

  it('rethrows cancellation without wrapping as JiraAddCommentError', async () => {
    const controller = new AbortController()

    jest.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal
        if (signal?.aborted) {
          reject(new DOMException('aborted', 'AbortError'))
          return
        }

        signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'))
        })
      })
    })

    const pending = resource().create('JC-1', 'hello', controller.signal)
    queueMicrotask(() => controller.abort())

    await expect(pending).rejects.toMatchObject({
      code: 'NETWORKING_REQUEST_CANCELLED_ERROR',
      name: 'NetworkingRequestCancelledError',
    })
  })
})


