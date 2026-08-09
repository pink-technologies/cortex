// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { GitHubClient, GitHubIssueCommentResource } from '../../../../src/github'

describe('GitHubIssueCommentResource', () => {
  const connection = {
    id: 'github-main',
    provider: 'github' as const,
    token: 'ghp_test',
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function resource(): GitHubIssueCommentResource {
    return new GitHubIssueCommentResource(new GitHubClient(connection))
  }

  it('creates comments', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 200 }))

    await resource().create(
      {
        owner: 'acme',
        repository: 'app',
        issueNumber: 12,
        body: '## Review',
      },
      new AbortController().signal,
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' })
  })

  it('throws GitHubIssueCommentCreateError when create fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('missing', { status: 404 }))

    await expect(
      resource().create(
        {
          owner: 'acme',
          repository: 'app',
          issueNumber: 12,
          body: '## Review',
        },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({
      code: 'GITHUB_ISSUE_COMMENT_CREATE_ERROR',
      name: 'GitHubIssueCommentCreateError',
    })
  })

  it('rethrows cancellation without wrapping as GitHubIssueCommentCreateError', async () => {
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

    const pending = resource().create(
      {
        owner: 'acme',
        repository: 'app',
        issueNumber: 12,
        body: '## Review',
      },
      controller.signal,
    )
    queueMicrotask(() => controller.abort())

    await expect(pending).rejects.toMatchObject({
      code: 'NETWORKING_REQUEST_CANCELLED_ERROR',
      name: 'NetworkingRequestCancelledError',
    })
  })
})
