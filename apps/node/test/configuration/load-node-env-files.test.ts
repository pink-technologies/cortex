// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadNodeEnvFiles } from '../../src/configuration/loaders/load-node-env-files'

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
      'GITHUB_TOKEN=from-node-env\n',
      'utf8',
    )

    const environment: NodeJS.ProcessEnv = {
      GITHUB_TOKEN: 'stale-shell-value',
    }

    loadNodeEnvFiles(workspace, environment)

    expect(environment.GITHUB_TOKEN).toBe('from-node-env')
  })

  it('lets apps/node/.env win over a repo-root .env', async () => {
    await mkdir(join(workspace, 'apps', 'node'), { recursive: true })
    await writeFile(join(workspace, '.env'), 'CURSOR_API_KEY=from-root\n', 'utf8')
    await writeFile(join(workspace, 'apps', 'node', '.env'), 'CURSOR_API_KEY=from-node\n', 'utf8')

    const environment: NodeJS.ProcessEnv = {}

    loadNodeEnvFiles(workspace, environment)

    expect(environment.CURSOR_API_KEY).toBe('from-node')
  })
})
