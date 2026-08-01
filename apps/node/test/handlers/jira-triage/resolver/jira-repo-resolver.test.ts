// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  parseGitHubRepositoryReference,
  resolveJiraRepository,
} from '../../../../src/handlers/jira-triage/resolver/jira-repo-resolver'
import { JiraIssue, JiraIssueRemoteLink } from '../../../../src/jira'

function issue(partial: {
  customFields?: Readonly<Record<string, unknown>>
  descriptionText?: string
  issueType?: string
  key?: string
  labels?: readonly string[]
  projectKey?: string
  remoteLinks?: readonly JiraIssueRemoteLink[]
  summary?: string
} = {}): JiraIssue {
  return new JiraIssue(
    undefined,
    partial.customFields ?? {},
    partial.descriptionText ?? 'broken',
    partial.issueType ?? 'Bug',
    partial.key ?? 'JC-1',
    partial.labels ?? [],
    partial.projectKey ?? 'JC',
    partial.remoteLinks ?? [],
    partial.summary ?? 'Bug',
  )
}

describe('resolveJiraRepository', () => {
  it('parses owner/repo and GitHub URLs', () => {
    expect(parseGitHubRepositoryReference('acme/app')).toEqual({
      cloneUrl: 'https://github.com/acme/app.git',
      name: 'app',
      owner: 'acme',
    })
    expect(parseGitHubRepositoryReference('https://github.com/acme/app.git')?.name).toBe('app')
  })

  it('prefers payload override', () => {
    const resolved = resolveJiraRepository({
      issue: issue({
        remoteLinks: [new JiraIssueRemoteLink('https://github.com/other/repo')],
      }),
      payloadRepository: {
        cloneUrl: 'https://github.com/acme/app.git',
        defaultBranch: 'main',
        name: 'app',
        owner: 'acme',
      },
      projectRepos: [],
    })

    expect(resolved).toMatchObject({
      kind: 'resolved',
      repository: { source: 'payload', owner: 'acme', name: 'app' },
    })
  })

  it('uses project map when links are absent', () => {
    const resolved = resolveJiraRepository({
      issue: issue(),
      projectRepos: [
        {
          cloneUrl: 'https://github.com/acme/app.git',
          defaultBranch: 'main',
          name: 'app',
          owner: 'acme',
          projectKey: 'JC',
          unitTestCommand: 'npm test',
        },
      ],
    })

    expect(resolved.kind).toBe('resolved')
    if (resolved.kind === 'resolved') {
      expect(resolved.repository.source).toBe('project_map')
      expect(resolved.repository.unitTestCommand).toBe('npm test')
    }
  })

  it('reports ambiguous remote links', () => {
    const resolved = resolveJiraRepository({
      issue: issue({
        remoteLinks: [
          new JiraIssueRemoteLink('https://github.com/acme/a'),
          new JiraIssueRemoteLink('https://github.com/acme/b'),
        ],
      }),
      projectRepos: [],
    })

    expect(resolved).toEqual({
      kind: 'ambiguous',
      repositories: ['acme/a', 'acme/b'],
    })
  })

  it('resolves from a custom field and reports missing maps', () => {
    expect(
      resolveJiraRepository({
        customFieldId: 'customfield_1',
        issue: issue({
          customFields: { customfield_1: 'acme/from-field' },
        }),
        projectRepos: [],
      }),
    ).toMatchObject({
      kind: 'resolved',
      repository: { name: 'from-field', source: 'custom_field' },
    })

    expect(
      resolveJiraRepository({
        issue: issue({ projectKey: 'ZZ' }),
        projectRepos: [],
      }),
    ).toEqual({ kind: 'missing' })
  })
})

