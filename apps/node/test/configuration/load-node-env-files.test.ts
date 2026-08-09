// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadNodeEnvFiles } from '../../src/configuration/load-node-env-files'

describe('loadNodeEnvFiles', () => {
  let workspace: string

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'cortex-load-env-'))
  })

  afterEach(async () => {
    await rm(workspace, { force: true, recursive: true })
  })

  it('overwrites stale shell values with apps/node/.env', async () => {
    await mkdir(join(workspace, 'apps', 'node'), { recursive: true })
    await writeFile(
      join(workspace, 'apps', 'node', '.env'),
      'CORTEX_JIRA_PROJECT_REPOS=[{"projectKey":"SCRUM","suites":{"TruvideoSdk":{"command":"make genbuild && xcodebuild test"}}}]\n',
      'utf8',
    )

    const environment: NodeJS.ProcessEnv = {
      CORTEX_JIRA_PROJECT_REPOS: '[{"projectKey":"SCRUM","suites":{"TruVideoSdkCore":{"command":"xcodebuild test"}}}]',
    }

    loadNodeEnvFiles(workspace, environment)

    expect(environment.CORTEX_JIRA_PROJECT_REPOS).toContain('make genbuild')
    expect(environment.CORTEX_JIRA_PROJECT_REPOS).toContain('TruvideoSdk')
  })

  it('lets apps/node/.env win over a repo-root .env', async () => {
    await mkdir(join(workspace, 'apps', 'node'), { recursive: true })
    await writeFile(join(workspace, '.env'), 'CORTEX_NODE_NAME=from-root\n', 'utf8')
    await writeFile(join(workspace, 'apps', 'node', '.env'), 'CORTEX_NODE_NAME=from-node\n', 'utf8')

    const environment: NodeJS.ProcessEnv = {}

    loadNodeEnvFiles(workspace, environment)

    expect(environment.CORTEX_NODE_NAME).toBe('from-node')
  })
})
