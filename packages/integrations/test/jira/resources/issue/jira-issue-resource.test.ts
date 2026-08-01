// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraClient, JiraIssueResource } from '../../../../src/jira'

describe('JiraIssueResource', () => {
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

  function resource(): JiraIssueResource {
    return new JiraIssueResource(new JiraClient(connection))
  }

  it('loads an issue and remote links', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            fields: {
              assignee: { accountId: 'a1', emailAddress: 'a@example.com' },
              description: {
                content: [
                  {
                    content: [
                      { text: 'Hello', type: 'text' },
                      { text: ' world', type: 'text' },
                    ],
                    type: 'paragraph',
                  },
                ],
                type: 'doc',
                version: 1,
              },
              issuetype: { name: 'Bug' },
              labels: ['x'],
              project: { key: 'JC' },
              summary: 'Summary',
            },
            key: 'JC-1',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ object: { title: 'Repo', url: 'https://github.com/acme/app' } }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

    const issue = await resource().get('JC-1', new AbortController().signal)

    expect(issue).toMatchObject({
      key: 'JC-1',
      projectKey: 'JC',
      summary: 'Summary',
      descriptionText: 'Hello world',
      remoteLinks: [{ title: 'Repo', url: 'https://github.com/acme/app' }],
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('maps plain-string and empty descriptions through get', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            fields: {
              description: '  plain  ',
              issuetype: { name: 'Task' },
              project: { key: 'JC' },
              summary: 'Plain',
            },
            key: 'JC-2',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            fields: {
              description: 12,
              issuetype: { name: 'Task' },
              project: { key: 'JC' },
              summary: 'Empty',
            },
            key: 'JC-3',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }))

    const issues = resource()
    const signal = new AbortController().signal

    await expect(issues.get('JC-2', signal)).resolves.toMatchObject({
      descriptionText: 'plain',
    })
    await expect(issues.get('JC-3', signal)).resolves.toMatchObject({
      descriptionText: '',
    })
  })

  it('assigns issues', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 200 }))

    await resource().assign('JC-1', 'human', new AbortController().signal)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'PUT' })
  })

  it('throws when issue lookup fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('missing', { status: 404 }))

    await expect(resource().get('JC-404', new AbortController().signal)).rejects.toMatchObject({
      code: 'JIRA_ISSUE_LOOKUP_ERROR',
      issueKey: 'JC-404',
      name: 'JiraIssueLookupError',
    })
  })

  it('throws when assign serialization fails softly', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('not-json', { status: 200, headers: { 'content-type': 'application/json' } }))

    await expect(resource().assign('JC-1', 'human', new AbortController().signal)).rejects.toMatchObject({
      code: 'JIRA_ASSIGN_ISSUE_ERROR',
      name: 'JiraAssignIssueError',
    })
  })

  it('throws when issue payload serialization fails softly', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('not-json', { status: 200, headers: { 'content-type': 'application/json' } }))

    await expect(resource().get('JC-1', new AbortController().signal)).rejects.toMatchObject({
      code: 'JIRA_ISSUE_LOOKUP_ERROR',
      name: 'JiraIssueLookupError',
    })
  })

  it('throws JiraIssueLookupError when remotelink fetch fails', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            fields: {
              issuetype: { name: 'Bug' },
              project: { key: 'JC' },
              summary: 'Summary',
            },
            key: 'JC-1',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(new Response('missing', { status: 404 }))

    await expect(resource().get('JC-1', new AbortController().signal)).rejects.toMatchObject({
      code: 'JIRA_ISSUE_LOOKUP_ERROR',
      name: 'JiraIssueLookupError',
    })
  })

  it('rethrows cancellation without wrapping as JiraIssueLookupError', async () => {
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

    const pending = resource().get('JC-1', controller.signal)
    queueMicrotask(() => controller.abort())

    await expect(pending).rejects.toMatchObject({
      code: 'NETWORKING_REQUEST_CANCELLED_ERROR',
      name: 'NetworkingRequestCancelledError',
    })
  })

  it('rethrows AbortError from mid-pipeline throwIfAborted', async () => {
    const controller = new AbortController()

    jest.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
      controller.abort()
      return new Response(
        JSON.stringify({
          fields: {
            issuetype: { name: 'Bug' },
            project: { key: 'JC' },
            summary: 'Summary',
          },
          key: 'JC-1',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )
    })

    await expect(resource().get('JC-1', controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    })
  })
})


