// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { RepositoryReviewJobKind } from '@cortex/protocol'
import { assertRepositoryReviewRuntimeReady } from '../../src/configuration/validators/assert-repository-review-runtime-ready'
import type { NodeConfiguration } from '../../src/configuration/node-configuration'

function configuration(partial: Partial<NodeConfiguration> = {}): NodeConfiguration {
  return {
    apiBaseURL: 'https://api.cortex.example',
    jiraConnections: [],
    jiraProjectRepos: [],
    llm: {},
    nodeName: 'worker',
    pollingIntervalMilliseconds: 2000,
    sourceControlConnections: [],
    version: '1.0.0',
    ...partial,
  }
}

describe('assertRepositoryReviewRuntimeReady', () => {
  it('allows agent-only Nodes without Cursor or GitHub credentials', () => {
    expect(() => {
      assertRepositoryReviewRuntimeReady(configuration(), ['agent.execute'])
    }).not.toThrow()
  })

  it('requires CURSOR_API_KEY when repository.review is advertised', () => {
    expect(() => {
      assertRepositoryReviewRuntimeReady(
        configuration({
          sourceControlConnections: [
            {
              id: 'github-main',
              provider: 'github',
              token: 'ghp_test',
            },
          ],
        }),
        [RepositoryReviewJobKind],
      )
    }).toThrow(/CURSOR_API_KEY/)
  })

  it('requires at least one GitHub connection when repository.review is advertised', () => {
    expect(() => {
      assertRepositoryReviewRuntimeReady(
        configuration({ cursorApiKey: 'cursor-key' }),
        [RepositoryReviewJobKind],
      )
    }).toThrow(/connections\.toml/)
  })

  it('passes when Cursor and a GitHub connection are configured', () => {
    expect(() => {
      assertRepositoryReviewRuntimeReady(
        configuration({
          cursorApiKey: 'cursor-key',
          sourceControlConnections: [
            {
              id: 'github-main',
              provider: 'github',
              token: 'ghp_test',
            },
          ],
        }),
        ['agent.execute', RepositoryReviewJobKind],
      )
    }).not.toThrow()
  })
})
