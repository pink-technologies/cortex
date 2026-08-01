// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraAddCommentError } from '../../../../../src/jira'

describe('JiraAddCommentError', () => {
  it('stores issue key, code, and cause', () => {
    const cause = new Error('transport')
    const error = new JiraAddCommentError('JC-2', { cause })

    expect(error.name).toBe('JiraAddCommentError')
    expect(error.code).toBe('JIRA_ADD_COMMENT_ERROR')
    expect(error.issueKey).toBe('JC-2')
    expect(error.message).toContain('JC-2')
    expect(error.cause).toBe(cause)
  })
})
