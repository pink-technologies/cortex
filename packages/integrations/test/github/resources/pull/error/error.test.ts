// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  GitHubDraftPullCreationError,
  GitHubDraftPullMissingUrlError,
  GitHubPullLookupError,
} from '../../../../../src/github'

describe('GitHubPullLookupError', () => {
  it('stores coordinates, code, and cause', () => {
    const cause = new Error('transport')
    const error = new GitHubPullLookupError('acme', 'app', 12, { cause })

    expect(error.name).toBe('GitHubPullLookupError')
    expect(error.code).toBe('GITHUB_PULL_LOOKUP_ERROR')
    expect(error.owner).toBe('acme')
    expect(error.repository).toBe('app')
    expect(error.pullNumber).toBe(12)
    expect(error.message).toContain('acme/app#12')
    expect(error.cause).toBe(cause)
  })
})

describe('GitHubDraftPullCreationError', () => {
  it('stores coordinates, code, and cause', () => {
    const cause = new Error('transport')
    const error = new GitHubDraftPullCreationError('acme', 'app', { cause })

    expect(error.name).toBe('GitHubDraftPullCreationError')
    expect(error.code).toBe('GITHUB_DRAFT_PULL_CREATION_ERROR')
    expect(error.owner).toBe('acme')
    expect(error.repository).toBe('app')
    expect(error.message).toContain('acme/app')
    expect(error.cause).toBe(cause)
  })
})

describe('GitHubDraftPullMissingUrlError', () => {
  it('stores coordinates and code', () => {
    const error = new GitHubDraftPullMissingUrlError('acme', 'app')

    expect(error.name).toBe('GitHubDraftPullMissingUrlError')
    expect(error.code).toBe('GITHUB_DRAFT_PULL_MISSING_URL_ERROR')
    expect(error.owner).toBe('acme')
    expect(error.repository).toBe('app')
    expect(error.message).toContain('acme/app')
  })
})
