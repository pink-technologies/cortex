// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraClient, JiraUserResource } from '../../../../src/jira'

describe('JiraUserResource', () => {
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

  function resource(): JiraUserResource {
    return new JiraUserResource(new JiraClient(connection))
  }

  it('prefers an exact email match from user search', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { accountId: 'other', displayName: 'Other', emailAddress: 'other@example.com' },
          { accountId: 'lead', displayName: 'Lead Dev', emailAddress: 'lead@example.com' },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    await expect(
      resource().findByEmail('lead@example.com', new AbortController().signal),
    ).resolves.toEqual({
      accountId: 'lead',
      displayName: 'Lead Dev',
      emailAddress: 'lead@example.com',
    })
  })

  it('throws JiraUserLookupError when search has no account id', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await expect(
      resource().findByEmail('missing@example.com', new AbortController().signal),
    ).rejects.toMatchObject({
      code: 'JIRA_USER_LOOKUP_ERROR',
      email: 'missing@example.com',
      name: 'JiraUserLookupError',
    })
  })

  it('throws JiraUserLookupError for a blank email without calling Jira', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')

    await expect(resource().findByEmail('   ', new AbortController().signal)).rejects.toMatchObject({
      code: 'JIRA_USER_LOOKUP_ERROR',
      name: 'JiraUserLookupError',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('falls back to the first hit when emails are redacted', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify([{ accountId: 'first', displayName: 'First Hit' }]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    await expect(
      resource().findByEmail('lead@example.com', new AbortController().signal),
    ).resolves.toEqual({
      accountId: 'first',
      displayName: 'First Hit',
      emailAddress: undefined,
    })
  })

  it('wraps transport failures as JiraUserLookupError', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('nope', { status: 500 }))

    await expect(
      resource().findByEmail('lead@example.com', new AbortController().signal),
    ).rejects.toMatchObject({
      code: 'JIRA_USER_LOOKUP_ERROR',
      name: 'JiraUserLookupError',
    })
  })

  it('rethrows cancellation without wrapping', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(resource().findByEmail('lead@example.com', controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    })
  })
})
