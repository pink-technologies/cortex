// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraIssue, JiraIssueAssignee, JiraIssueRemoteLink } from '../../../../../src/jira'

describe('JiraIssue', () => {
  it('maps issue fields, custom fields, assignee, and ADF description', () => {
    const issue = JiraIssue.from(
      {
        fields: {
          assignee: {
            accountId: 'a1',
            displayName: 'Ada',
            emailAddress: 'ada@example.com',
          },
          customfield_10001: 'acme/app',
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
          issuetype: { name: ' Bug ' },
          labels: ['x'],
          project: { key: ' JC ' },
          summary: ' Summary ',
        },
        key: 'JC-1',
      },
      [new JiraIssueRemoteLink('https://github.com/acme/app', 'Repo')],
      'JC-1',
    )

    expect(issue).toMatchObject({
      assignee: {
        accountId: 'a1',
        displayName: 'Ada',
        emailAddress: 'ada@example.com',
      },
      customFields: { customfield_10001: 'acme/app' },
      descriptionText: 'Hello world',
      issueType: 'Bug',
      key: 'JC-1',
      labels: ['x'],
      projectKey: 'JC',
      summary: 'Summary',
    })
    expect(issue.assignee).toBeInstanceOf(JiraIssueAssignee)
    expect(issue.remoteLinks[0]).toBeInstanceOf(JiraIssueRemoteLink)
  })

  it('applies defaults when optional wire fields are missing', () => {
    const issue = JiraIssue.from({}, [], 'ZZ-9')

    expect(issue).toMatchObject({
      assignee: undefined,
      customFields: {},
      descriptionText: '',
      issueType: 'Unknown',
      key: 'ZZ-9',
      labels: [],
      projectKey: 'ZZ',
      summary: 'ZZ-9',
    })
  })

  it('ignores assignees without an account id and falls back project key', () => {
    const issue = JiraIssue.from(
      {
        fields: {
          assignee: { displayName: 'No Id' },
          issuetype: { name: 'Bug' },
          summary: 'S',
        },
      },
      [],
      '-orphan',
    )

    expect(issue.assignee).toBeUndefined()
    expect(issue.projectKey).toBe('-orphan')
  })

  it('flattens plain-string descriptions and ignores non-text nodes', () => {
    expect(
      JiraIssue.from(
        {
          fields: {
            description: '  plain  ',
            issuetype: { name: 'Task' },
            project: { key: 'JC' },
            summary: 'Plain',
          },
          key: 'JC-2',
        },
        [],
        'JC-2',
      ).descriptionText,
    ).toBe('plain')

    expect(
      JiraIssue.from(
        {
          fields: {
            description: 12,
            issuetype: { name: 'Task' },
            project: { key: 'JC' },
            summary: 'Empty',
          },
          key: 'JC-3',
        },
        [],
        'JC-3',
      ).descriptionText,
    ).toBe('')

    expect(
      JiraIssue.from(
        {
          fields: {
            description: {
              content: [{ content: [null, { text: 'ok' }], type: 'paragraph' }, 'skip'],
              type: 'doc',
            },
            issuetype: { name: 'Task' },
            project: { key: 'JC' },
            summary: 'Mixed',
          },
          key: 'JC-4',
        },
        [],
        'JC-4',
      ).descriptionText,
    ).toBe('ok')
  })

  it('uses the issue key when the payload omits key and project', () => {
    const issue = JiraIssue.from(
      {
        fields: {
          labels: 'not-an-array' as unknown as string[],
          summary: '  ',
        },
      },
      [],
      'NOKEY',
    )

    expect(issue.key).toBe('NOKEY')
    expect(issue.projectKey).toBe('NOKEY')
    expect(issue.labels).toEqual([])
    expect(issue.summary).toBe('NOKEY')
  })
})

describe('JiraIssueRemoteLink', () => {
  it('maps a response entry and ignores entries without a URL', () => {
    expect(
      JiraIssueRemoteLink.from({
        object: { title: 'Repo', url: ' https://github.com/acme/app ' },
      }),
    ).toEqual(new JiraIssueRemoteLink('https://github.com/acme/app', 'Repo'))

    expect(JiraIssueRemoteLink.from({ object: { title: 'Missing' } })).toBeUndefined()
    expect(JiraIssueRemoteLink.from({})).toBeUndefined()
    expect(JiraIssueRemoteLink.from({ object: { url: '   ' } })).toBeUndefined()
  })
})
