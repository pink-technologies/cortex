// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  JiraClient,
  JiraCommentMentionPlaceholder,
  JiraCommentResource,
} from '../../../../src/jira'

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

  it('embeds an ADF mention when the placeholder and mention are provided', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 200 }))

    await resource().create(
      'JC-1',
      `Done.\nEscalating the issue to ${JiraCommentMentionPlaceholder}.`,
      new AbortController().signal,
      { accountId: 'lead-1', displayName: 'Jorge Orjuela' },
    )

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    const body = JSON.parse(String(init.body)) as {
      body: { content: Array<{ content: Array<Record<string, unknown>> }> }
    }
    const inline = body.body.content[0]?.content ?? []
    expect(inline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'hardBreak' }),
        expect.objectContaining({
          attrs: expect.objectContaining({
            id: 'lead-1',
            text: '@Jorge Orjuela',
          }),
          type: 'mention',
        }),
      ]),
    )
  })

  it('keeps an explicit @ on the mention display name', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 200 }))

    await resource().create(
      'JC-1',
      `To ${JiraCommentMentionPlaceholder}`,
      new AbortController().signal,
      { accountId: 'lead-1', displayName: '@Already At' },
    )

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    const body = JSON.parse(String(init.body)) as {
      body: { content: Array<{ content: Array<Record<string, unknown>> }> }
    }
    const mention = body.body.content[0]?.content.find((node) => node.type === 'mention')
    expect(mention).toMatchObject({
      attrs: { text: '@Already At' },
    })
  })

  it('posts an empty text node for an empty body', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 200 }))

    await resource().create('JC-1', '', new AbortController().signal)

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    const body = JSON.parse(String(init.body)) as {
      body: { content: Array<{ content: Array<Record<string, unknown>> }> }
    }
    expect(body.body.content[0]?.content).toEqual([{ text: '', type: 'text' }])
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


