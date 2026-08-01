// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { GitHubClient, GitHubPullResource } from '../../../../src/github'

describe('GitHubPullResource', () => {
  const connection = {
    id: 'github-main',
    provider: 'github' as const,
    token: 'ghp_test',
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function resource(): GitHubPullResource {
    return new GitHubPullResource(new GitHubClient(connection))
  }

  it('loads a pull request', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          body: 'PR body',
          head: { ref: 'feature' },
          html_url: 'https://github.com/acme/app/pull/12',
          number: 12,
          title: 'Add feature',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const pull = await resource().get('acme', 'app', 12, new AbortController().signal)

    expect(pull).toMatchObject({
      body: 'PR body',
      headRef: 'feature',
      number: 12,
      title: 'Add feature',
      url: 'https://github.com/acme/app/pull/12',
    })
  })

  it('throws GitHubPullLookupError when lookup fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('missing', { status: 404 }))

    await expect(resource().get('acme', 'app', 12, new AbortController().signal)).rejects.toMatchObject({
      code: 'GITHUB_PULL_LOOKUP_ERROR',
      name: 'GitHubPullLookupError',
    })
  })

  it('creates a draft pull request and returns its URL', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ html_url: 'https://github.com/acme/app/pull/99', number: 99, title: 'fix' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const url = await resource().createDraft(
      'acme',
      'app',
      {
        base: 'main',
        body: 'Automated fix',
        head: 'cortex/fix',
        title: 'fix: crash',
      },
      new AbortController().signal,
    )

    expect(url).toBe('https://github.com/acme/app/pull/99')
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' })
  })

  it('throws GitHubDraftPullMissingUrlError when html_url is absent', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ number: 1, title: 'Fix' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await expect(
      resource().createDraft(
        'acme',
        'app',
        { base: 'main', body: 'x', head: 'branch', title: 'Fix' },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({
      code: 'GITHUB_DRAFT_PULL_MISSING_URL_ERROR',
      name: 'GitHubDraftPullMissingUrlError',
    })
  })

  it('throws GitHubDraftPullCreationError when create fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('boom', { status: 500 }))

    await expect(
      resource().createDraft(
        'acme',
        'app',
        { base: 'main', body: 'x', head: 'branch', title: 'Fix' },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({
      code: 'GITHUB_DRAFT_PULL_CREATION_ERROR',
      name: 'GitHubDraftPullCreationError',
    })
  })

  it('rethrows cancellation without wrapping as GitHubPullLookupError', async () => {
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

    const pending = resource().get('acme', 'app', 12, controller.signal)
    queueMicrotask(() => controller.abort())

    await expect(pending).rejects.toMatchObject({
      code: 'NETWORKING_REQUEST_CANCELLED_ERROR',
      name: 'NetworkingRequestCancelledError',
    })
  })

  it('rethrows cancellation without wrapping as GitHubDraftPullCreationError', async () => {
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

    const pending = resource().createDraft(
      'acme',
      'app',
      { base: 'main', body: 'x', head: 'branch', title: 'Fix' },
      controller.signal,
    )
    queueMicrotask(() => controller.abort())

    await expect(pending).rejects.toMatchObject({
      code: 'NETWORKING_REQUEST_CANCELLED_ERROR',
      name: 'NetworkingRequestCancelledError',
    })
  })
})


