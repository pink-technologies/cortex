// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  parseGitHubRepositoryReference,
  resolveJiraRepository,
} from '../../../../src/handlers/jira-triage/resolver/jira-repo-resolver'
import { JiraIssue, JiraIssueRemoteLink } from '@cortex/integrations/jira'

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
  it('parses owner/repo, HTTPS, www, and SSH GitHub references', () => {
    expect(parseGitHubRepositoryReference('acme/app')).toEqual({
      cloneUrl: 'https://github.com/acme/app.git',
      name: 'app',
      owner: 'acme',
    })
    expect(parseGitHubRepositoryReference('https://github.com/acme/app.git')?.name).toBe('app')
    expect(parseGitHubRepositoryReference('https://www.github.com/acme/app')).toEqual({
      cloneUrl: 'https://github.com/acme/app.git',
      name: 'app',
      owner: 'acme',
    })
    expect(parseGitHubRepositoryReference('git@github.com:acme/app.git')).toEqual({
      cloneUrl: 'https://github.com/acme/app.git',
      name: 'app',
      owner: 'acme',
    })
    expect(parseGitHubRepositoryReference('https://gitlab.com/acme/app')).toBeUndefined()
    expect(parseGitHubRepositoryReference('https://github.com/only-owner')).toBeUndefined()
    expect(parseGitHubRepositoryReference('not a url')).toBeUndefined()
  })

  it('prefers payload override and merges project-map test commands', () => {
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
      projectRepos: [
        {
          cloneUrl: 'https://github.com/acme/mapped.git',
          defaultBranch: 'develop',
          name: 'mapped',
          owner: 'acme',
          projectKey: 'JC',
          suites: {
            TruVideoSdkCore: {
              command: 'xcodebuild test -scheme TruVideoSdkCore',
            },
          },
          unitTestCommand: 'npm test',
          uiTestCommand: 'npx playwright test',
        },
      ],
    })

    expect(resolved).toMatchObject({
      kind: 'resolved',
      repository: {
        source: 'payload',
        owner: 'acme',
        name: 'app',
        suites: {
          TruVideoSdkCore: {
            command: 'xcodebuild test -scheme TruVideoSdkCore',
          },
        },
        unitTestCommand: 'npm test',
        uiTestCommand: 'npx playwright test',
      },
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
          suites: {
            TruVideoSdkCore: {
              command: 'xcodebuild test -scheme TruVideoSdkCore',
            },
            TruVideoSdkCamera: {
              command: 'xcodebuild test -scheme TruVideoSdkCamera',
            },
          },
          unitTestCommand: 'npm test',
        },
      ],
    })

    expect(resolved.kind).toBe('resolved')
    if (resolved.kind === 'resolved') {
      expect(resolved.repository.source).toBe('project_map')
      expect(resolved.repository.unitTestCommand).toBe('npm test')
      expect(resolved.repository.suites).toEqual({
        TruVideoSdkCamera: {
          command: 'xcodebuild test -scheme TruVideoSdkCamera',
        },
        TruVideoSdkCore: {
          command: 'xcodebuild test -scheme TruVideoSdkCore',
        },
      })
    }
  })

  it('reports ambiguous remote links and dedupes equivalent URLs', () => {
    expect(
      resolveJiraRepository({
        issue: issue({
          remoteLinks: [
            new JiraIssueRemoteLink('https://github.com/acme/a'),
            new JiraIssueRemoteLink('https://github.com/acme/b'),
          ],
        }),
        projectRepos: [],
      }),
    ).toEqual({
      kind: 'ambiguous',
      repositories: ['acme/a', 'acme/b'],
    })

    expect(
      resolveJiraRepository({
        issue: issue({
          remoteLinks: [
            new JiraIssueRemoteLink('https://github.com/acme/app.git'),
            new JiraIssueRemoteLink('git@github.com:acme/app'),
          ],
        }),
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
      }),
    ).toMatchObject({
      kind: 'resolved',
      repository: { source: 'jira_links', unitTestCommand: 'npm test' },
    })
  })

  it('resolves from a custom field object value and falls through when unparseable', () => {
    expect(
      resolveJiraRepository({
        customFieldId: 'customfield_1',
        issue: issue({
          customFields: { customfield_1: { value: 'acme/from-field' } },
        }),
        projectRepos: [],
      }),
    ).toMatchObject({
      kind: 'resolved',
      repository: { name: 'from-field', source: 'custom_field' },
    })

    expect(
      resolveJiraRepository({
        customFieldId: 'customfield_1',
        issue: issue({
          customFields: { customfield_1: 'not a repo' },
        }),
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
      }),
    ).toMatchObject({
      kind: 'resolved',
      repository: { source: 'project_map', unitTestCommand: 'npm test' },
    })

    expect(
      resolveJiraRepository({
        customFieldId: 'customfield_1',
        issue: issue({
          customFields: { customfield_1: 42 },
        }),
        projectRepos: [],
      }),
    ).toEqual({ kind: 'missing' })

    expect(
      resolveJiraRepository({
        issue: issue({ projectKey: 'ZZ' }),
        projectRepos: [],
      }),
    ).toEqual({ kind: 'missing' })
  })
})

