// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { CommandConfiguration } from '../../../../src/connection'
import { resolveAllowlistedSuites } from '../../../../src/handlers/jira-triage/resolver/resolve-allowlisted-suites'
import type { ResolvedJiraRepository } from '../../../../src/handlers/jira-triage/models'

function suite(
  executable: string,
  argumentsList: readonly string[] = [],
): CommandConfiguration {
  return {
    arguments: argumentsList,
    executable,
    workingDirectory: '.',
  }
}

function repository(
  overrides: Partial<ResolvedJiraRepository> = {},
): ResolvedJiraRepository {
  return {
    cloneUrl: 'https://github.com/acme/app.git',
    defaultBranch: 'main',
    name: 'app',
    owner: 'acme',
    source: 'project_map',
    ...overrides,
  }
}

const truvideoRepository = repository({
  areas: {
    App: {
      aliases: ['TruVideoApp', 'TruVideoSdkCore', 'Core'],
      suiteKeys: ['TruVideoSdkCore'],
    },
    Camera: {
      aliases: ['TruVideoSdkCamera', 'Camera SDK', 'Media'],
      suiteKeys: ['TruVideoSdkCamera'],
    },
  },
  suites: {
    TruVideoSdkCamera: suite('xcodebuild', ['test', '-scheme', 'TruVideoSdkCamera']),
    TruVideoSdkCore: suite('xcodebuild', ['test', '-scheme', 'TruVideoSdkCore']),
  },
})

describe('resolveAllowlistedSuites', () => {
  it('returns named suite commands', () => {
    expect(
      resolveAllowlistedSuites(
        repository({
          suites: {
            TruVideoSdkCore: suite('xcodebuild', ['test', '-scheme', 'TruVideoSdkCore']),
          },
        }),
      ),
    ).toEqual({
      TruVideoSdkCore: suite('xcodebuild', ['test', '-scheme', 'TruVideoSdkCore']),
    })
  })

  it('maps classification areas to suite commands', () => {
    expect(
      resolveAllowlistedSuites(truvideoRepository, {
        selectedAreas: ['App'],
      }),
    ).toEqual({
      TruVideoSdkCore: suite('xcodebuild', ['test', '-scheme', 'TruVideoSdkCore']),
    })
  })

  it('maps area aliases from ticket text when classification areas are empty', () => {
    expect(
      resolveAllowlistedSuites(truvideoRepository, {
        issueText:
          '[iOS] Fix TruVideoApp thread synchronization race condition on configuration state',
        selectedAreas: [],
      }),
    ).toEqual({
      TruVideoSdkCore: suite('xcodebuild', ['test', '-scheme', 'TruVideoSdkCore']),
    })
  })

  it('runs all named suites when no area matches', () => {
    expect(
      resolveAllowlistedSuites(truvideoRepository, {
        issueText: 'Vague bug with no module names',
        selectedAreas: [],
      }),
    ).toEqual({
      TruVideoSdkCamera: suite('xcodebuild', ['test', '-scheme', 'TruVideoSdkCamera']),
      TruVideoSdkCore: suite('xcodebuild', ['test', '-scheme', 'TruVideoSdkCore']),
    })
  })

  it('returns an empty map when nothing is configured', () => {
    expect(resolveAllowlistedSuites(repository())).toEqual({})
  })

  it('ignores blank selected areas and blank alias needles', () => {
    expect(
      resolveAllowlistedSuites(truvideoRepository, {
        selectedAreas: [' ', ''],
      }),
    ).toEqual({
      TruVideoSdkCamera: suite('xcodebuild', ['test', '-scheme', 'TruVideoSdkCamera']),
      TruVideoSdkCore: suite('xcodebuild', ['test', '-scheme', 'TruVideoSdkCore']),
    })

    expect(
      resolveAllowlistedSuites(
        repository({
          areas: {
            App: {
              aliases: ['', '  ', 'SDK'],
              suiteKeys: ['unit'],
            },
          },
          suites: {
            unit: suite('pnpm', ['test']),
          },
        }),
        { issueText: 'needs SDK coverage' },
      ),
    ).toEqual({
      unit: suite('pnpm', ['test']),
    })
  })

  it('matches short area ids with word boundaries', () => {
    expect(
      resolveAllowlistedSuites(
        repository({
          areas: {
            UI: {
              suiteKeys: ['ui'],
            },
          },
          suites: {
            ui: suite('pnpm', ['test:ui']),
          },
        }),
        { issueText: 'Broken UI button' },
      ),
    ).toEqual({
      ui: suite('pnpm', ['test:ui']),
    })
  })

  it('falls back to the full catalog when an area maps only to missing suites', () => {
    expect(
      resolveAllowlistedSuites(
        repository({
          areas: {
            App: {
              suiteKeys: ['MissingSuite'],
            },
          },
          suites: {
            unit: suite('pnpm', ['test']),
          },
        }),
        { selectedAreas: ['App'] },
      ),
    ).toEqual({
      unit: suite('pnpm', ['test']),
    })
  })
})
