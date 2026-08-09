// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { TomlDecoder } from '../../../src/manifest/decoder/decoder'
import { CapabilityDefinitionLoader } from '../../../src/capabilities/loader'
import { capabilitySchema } from '../../../src/capabilities/schema'

describe('CapabilityDefinitionLoader', () => {
  let rootDirectory: string

  beforeEach(async () => {
    rootDirectory = await mkdtemp(join(tmpdir(), 'cortex-capabilities-'))
  })

  afterEach(async () => {
    await rm(rootDirectory, { force: true, recursive: true })
  })

  it('loads capability definitions from child directories', async () => {
    await writeFile(join(rootDirectory, 'README.md'), '# capabilities\n', 'utf8')

    const capabilityDirectory = join(rootDirectory, 'repository.review')

    await mkdir(capabilityDirectory)
    await writeFile(
      join(capabilityDirectory, 'capability.toml'),
      [
        'id = "repository.review"',
        'description = "Reviews source-control changes."',
        'default_agent = "repository-reviewer"',
        'tools = ["repo.diff"]',
        '',
      ].join('\n'),
      'utf8',
    )

    const loader = new CapabilityDefinitionLoader(new TomlDecoder())
    const definitions = await loader.loadFromRootDirectory(rootDirectory)

    expect(definitions).toEqual([
      {
        defaultAgentId: 'repository-reviewer',
        description: 'Reviews source-control changes.',
        id: 'repository.review',
        toolNames: ['repo.diff'],
      },
    ])
  })

  it('rejects invalid capability manifests', async () => {
    const capabilityDirectory = join(rootDirectory, 'broken')

    await mkdir(capabilityDirectory)
    await writeFile(join(capabilityDirectory, 'capability.toml'), 'id = ""\n', 'utf8')

    const loader = new CapabilityDefinitionLoader(new TomlDecoder())

    await expect(loader.loadFromRootDirectory(rootDirectory)).rejects.toThrow(
      /Failed to load capability from directory: broken/,
    )
  })

  it('validates the capability schema shape', () => {
    expect(() =>
      capabilitySchema.parse({
        description: 'Reviews source-control changes.',
        id: 'repository.review',
        tools: ['repo.diff', 'repo.diff'],
      }),
    ).toThrow()
  })
})
