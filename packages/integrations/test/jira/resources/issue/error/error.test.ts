// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraAssignIssueError, JiraIssueLookupError } from '../../../../../src/jira'

describe('JiraIssueLookupError', () => {
  it('stores issue key, code, and cause', () => {
    const cause = new Error('transport')
    const error = new JiraIssueLookupError('JC-1', { cause })

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('JiraIssueLookupError')
    expect(error.code).toBe('JIRA_ISSUE_LOOKUP_ERROR')
    expect(error.issueKey).toBe('JC-1')
    expect(error.message).toContain('JC-1')
    expect(error.cause).toBe(cause)
  })
})

describe('JiraAssignIssueError', () => {
  it('stores issue key, account id, code, and cause', () => {
    const cause = new Error('transport')
    const error = new JiraAssignIssueError('JC-3', 'account-1', { cause })

    expect(error.name).toBe('JiraAssignIssueError')
    expect(error.code).toBe('JIRA_ASSIGN_ISSUE_ERROR')
    expect(error.issueKey).toBe('JC-3')
    expect(error.accountId).toBe('account-1')
    expect(error.message).toContain('JC-3')
    expect(error.message).toContain('account-1')
    expect(error.cause).toBe(cause)
  })
})
