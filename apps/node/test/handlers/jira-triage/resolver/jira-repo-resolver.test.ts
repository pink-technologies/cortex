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
              arguments: ['test', '-scheme', 'TruVideoSdkCore'],
              executable: 'xcodebuild',
              workingDirectory: '.',
            },
          },
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
            arguments: ['test', '-scheme', 'TruVideoSdkCore'],
            executable: 'xcodebuild',
            workingDirectory: '.',
          },
        },
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
              arguments: ['test', '-scheme', 'TruVideoSdkCore'],
              executable: 'xcodebuild',
              workingDirectory: '.',
            },
            TruVideoSdkCamera: {
              arguments: ['test', '-scheme', 'TruVideoSdkCamera'],
              executable: 'xcodebuild',
              workingDirectory: '.',
            },
          },
        },
      ],
    })

    expect(resolved.kind).toBe('resolved')
    if (resolved.kind === 'resolved') {
      expect(resolved.repository.source).toBe('project_map')
      expect(resolved.repository.suites).toEqual({
        TruVideoSdkCamera: {
          arguments: ['test', '-scheme', 'TruVideoSdkCamera'],
          executable: 'xcodebuild',
          workingDirectory: '.',
        },
        TruVideoSdkCore: {
          arguments: ['test', '-scheme', 'TruVideoSdkCore'],
          executable: 'xcodebuild',
          workingDirectory: '.',
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
            suites: {
              unit: {
                arguments: ['test'],
                executable: 'npm',
                workingDirectory: '.',
              },
            },
          },
        ],
      }),
    ).toMatchObject({
      kind: 'resolved',
      repository: {
        source: 'jira_links',
        suites: {
          unit: {
            arguments: ['test'],
            executable: 'npm',
            workingDirectory: '.',
          },
        },
      },
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
            suites: {
              unit: {
                arguments: ['test'],
                executable: 'npm',
                workingDirectory: '.',
              },
            },
          },
        ],
      }),
    ).toMatchObject({
      kind: 'resolved',
      repository: {
        source: 'project_map',
        suites: {
          unit: {
            arguments: ['test'],
            executable: 'npm',
            workingDirectory: '.',
          },
        },
      },
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

