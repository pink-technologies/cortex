// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { TomlLoader, TomlLoaderError } from '../../src/configuration/loaders/toml-loader'
import { z } from 'zod'

describe('TomlLoader', () => {
  const loader = new TomlLoader()

  async function writeTempToml(contents: string): Promise<string> {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'cortex-toml-loader-'))
    const filePath = path.join(directory, 'sample.toml')
    await writeFile(filePath, contents, 'utf8')
    return filePath
  }

  it('loads plain TOML values from disk', async () => {
    const filePath = await writeTempToml('name = "cortex"')

    await expect(loader.load(filePath)).resolves.toEqual({ name: 'cortex' })
  })

  it('strips @iarna/toml Symbol metadata so Zod records can parse nested tables', async () => {
    const filePath = await writeTempToml(`
[suites.unit]
executable = "pnpm"
`)
    const decoded = (await loader.load(filePath)) as {
      suites: Record<string | symbol, unknown>
    }

    expect(Object.getOwnPropertySymbols(decoded.suites)).toEqual([])
    expect(decoded.suites.unit).toEqual({ executable: 'pnpm' })
  })

  it('applies a typed refinement', async () => {
    const schema = z.object({ name: z.string() }).strict()
    const filePath = await writeTempToml('name = "cortex"')

    await expect(loader.load(filePath, (value) => schema.parse(value))).resolves.toEqual({
      name: 'cortex',
    })
  })

  it('throws TomlLoaderError for malformed TOML', async () => {
    const filePath = await writeTempToml('schemaVersion = [')

    await expect(loader.load(filePath)).rejects.toThrow(TomlLoaderError)
  })

  it('throws TomlLoaderError when the file is missing', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'cortex-toml-loader-missing-'))

    await expect(loader.load(path.join(directory, 'missing.toml'))).rejects.toThrow(
      TomlLoaderError,
    )
  })
})
