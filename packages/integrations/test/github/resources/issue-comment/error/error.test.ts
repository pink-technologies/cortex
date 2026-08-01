// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { GitHubIssueCommentCreateError } from '../../../../../src/github'

describe('GitHubIssueCommentCreateError', () => {
  it('stores coordinates, code, and cause', () => {
    const cause = new Error('transport')
    const error = new GitHubIssueCommentCreateError('acme', 'app', 9, { cause })

    expect(error.name).toBe('GitHubIssueCommentCreateError')
    expect(error.code).toBe('GITHUB_ISSUE_COMMENT_CREATE_ERROR')
    expect(error.owner).toBe('acme')
    expect(error.repository).toBe('app')
    expect(error.issueNumber).toBe(9)
    expect(error.message).toContain('acme/app#9')
    expect(error.cause).toBe(cause)
  })
})
