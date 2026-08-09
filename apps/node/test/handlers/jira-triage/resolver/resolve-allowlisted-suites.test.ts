// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { resolveAllowlistedSuites } from '../../../../src/handlers/jira-triage/resolver/resolve-allowlisted-suites'
import type { ResolvedJiraRepository } from '../../../../src/handlers/jira-triage/models'

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
    TruVideoSdkCamera: {
      command: 'xcodebuild test -scheme TruVideoSdkCamera',
    },
    TruVideoSdkCore: {
      command: 'xcodebuild test -scheme TruVideoSdkCore',
    },
  },
})

describe('resolveAllowlistedSuites', () => {
  it('prefers named suites over legacy unit/ui commands', () => {
    expect(
      resolveAllowlistedSuites(
        repository({
          suites: {
            TruVideoSdkCore: {
              command: 'xcodebuild test -scheme TruVideoSdkCore',
            },
          },
          unitTestCommand: 'npm test',
          uiTestCommand: 'npx playwright test',
        }),
      ),
    ).toEqual({
      TruVideoSdkCore: 'xcodebuild test -scheme TruVideoSdkCore',
    })
  })

  it('maps classification areas to suite commands', () => {
    expect(
      resolveAllowlistedSuites(truvideoRepository, {
        selectedAreas: ['App'],
      }),
    ).toEqual({
      TruVideoSdkCore: 'xcodebuild test -scheme TruVideoSdkCore',
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
      TruVideoSdkCore: 'xcodebuild test -scheme TruVideoSdkCore',
    })
  })

  it('runs all named suites when no area matches', () => {
    expect(
      resolveAllowlistedSuites(truvideoRepository, {
        issueText: 'Vague bug with no module names',
        selectedAreas: [],
      }),
    ).toEqual({
      TruVideoSdkCamera: 'xcodebuild test -scheme TruVideoSdkCamera',
      TruVideoSdkCore: 'xcodebuild test -scheme TruVideoSdkCore',
    })
  })

  it('falls back to legacy unit/ui commands when suites are absent', () => {
    expect(
      resolveAllowlistedSuites(
        repository({
          unitTestCommand: 'npm test',
          uiTestCommand: 'npx playwright test',
        }),
      ),
    ).toEqual({
      unit: 'npm test',
      ui: 'npx playwright test',
    })
  })

  it('returns an empty map when nothing is configured', () => {
    expect(resolveAllowlistedSuites(repository())).toEqual({})
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
            TruVideoSdkCore: {
              command: 'xcodebuild test -scheme TruVideoSdkCore',
            },
          },
        }),
        { selectedAreas: ['App'] },
      ),
    ).toEqual({
      TruVideoSdkCore: 'xcodebuild test -scheme TruVideoSdkCore',
    })
  })

  it('matches short aliases with word boundaries and ignores blank selectors', () => {
    expect(
      resolveAllowlistedSuites(
        repository({
          areas: {
            App: {
              aliases: ['UI', ''],
              suiteKeys: ['TruVideoSdkCore'],
            },
          },
          suites: {
            TruVideoSdkCore: {
              command: 'xcodebuild test -scheme TruVideoSdkCore',
            },
          },
        }),
        {
          issueText: 'Crash in UI when opening settings',
          selectedAreas: ['', '  '],
        },
      ),
    ).toEqual({
      TruVideoSdkCore: 'xcodebuild test -scheme TruVideoSdkCore',
    })
  })

  it('dedupes classification areas that resolve to the same canonical id', () => {
    expect(
      resolveAllowlistedSuites(truvideoRepository, {
        selectedAreas: ['App', 'TruVideoApp', 'Core'],
      }),
    ).toEqual({
      TruVideoSdkCore: 'xcodebuild test -scheme TruVideoSdkCore',
    })
  })
})
