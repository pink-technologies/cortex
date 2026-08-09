// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { RepositoryReviewJobKind } from '@cortex/protocol'
import { assertRepositoryReviewRuntimeReady } from '../../src/configuration/assert-repository-review-runtime-ready'
import {
  createNodeConfiguration,
  type NodeConfiguration,
} from '../../src/configuration/node-configuration'

const baseEnvironment = {
  CORTEX_API_URL: 'https://api.cortex.example',
  CORTEX_NODE_NAME: 'worker',
  CORTEX_NODE_VERSION: '1.0.0',
} satisfies NodeJS.ProcessEnv

describe('assertRepositoryReviewRuntimeReady', () => {
  it('allows agent-only Nodes without Cursor or GitHub credentials', () => {
    const configuration = createNodeConfiguration(baseEnvironment)

    expect(() => {
      assertRepositoryReviewRuntimeReady(configuration, ['agent.execute'])
    }).not.toThrow()
  })

  it('requires CURSOR_API_KEY when repository.review is advertised', () => {
    const configuration = createNodeConfiguration({
      ...baseEnvironment,
      CORTEX_SC_CONNECTIONS: JSON.stringify([
        {
          id: 'github-main',
          provider: 'github',
          token: 'ghp_test',
        },
      ]),
    })

    expect(() => {
      assertRepositoryReviewRuntimeReady(configuration, [RepositoryReviewJobKind])
    }).toThrow(/CURSOR_API_KEY/)
  })

  it('requires at least one GitHub connection when repository.review is advertised', () => {
    const configuration = createNodeConfiguration({
      ...baseEnvironment,
      CURSOR_API_KEY: 'cursor-key',
    })

    expect(() => {
      assertRepositoryReviewRuntimeReady(configuration, [RepositoryReviewJobKind])
    }).toThrow(/CORTEX_SC_CONNECTIONS/)
  })

  it('requires provider github when connections omit it', () => {
    const configuration = {
      ...createNodeConfiguration({
        ...baseEnvironment,
        CURSOR_API_KEY: 'cursor-key',
      }),
      sourceControlConnections: [
        {
          id: 'other',
          provider: 'other',
          token: 'token',
        },
      ],
    } as unknown as NodeConfiguration

    expect(() => {
      assertRepositoryReviewRuntimeReady(configuration, [RepositoryReviewJobKind])
    }).toThrow(/provider "github"/)
  })

  it('passes when Cursor and a GitHub connection are configured', () => {
    const configuration = createNodeConfiguration({
      ...baseEnvironment,
      CURSOR_API_KEY: 'cursor-key',
      CORTEX_SC_CONNECTIONS: JSON.stringify([
        {
          id: 'github-main',
          provider: 'github',
          token: 'ghp_test',
        },
      ]),
    })

    expect(() => {
      assertRepositoryReviewRuntimeReady(configuration, [
        'agent.execute',
        RepositoryReviewJobKind,
      ])
    }).not.toThrow()
  })
})
