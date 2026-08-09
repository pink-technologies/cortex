// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { TomlDecoder } from '../../../src/manifest/decoder/decoder'
import { SkillDefinitionLoader } from '../../../src/skills/loader'
import { skillSchema } from '../../../src/skills/schema'

describe('SkillDefinitionLoader', () => {
  let rootDirectory: string

  beforeEach(async () => {
    rootDirectory = await mkdtemp(join(tmpdir(), 'cortex-skills-'))
  })

  afterEach(async () => {
    await rm(rootDirectory, { force: true, recursive: true })
  })

  it('loads skill definitions from child directories', async () => {
    const skillDirectory = join(rootDirectory, 'code-review-diff')

    await mkdir(skillDirectory)
    await writeFile(
      join(skillDirectory, 'skill.toml'),
      [
        'id = "code-review-diff"',
        'description = "Diff-focused review guidance."',
        'prompt_file = "prompt.md"',
        'keywords = ["diff", "pull-request"]',
        '',
      ].join('\n'),
      'utf8',
    )
    await writeFile(join(skillDirectory, 'prompt.md'), 'Focus on the change set.\n', 'utf8')

    const loader = new SkillDefinitionLoader(new TomlDecoder())
    const definitions = await loader.loadFromRootDirectory(rootDirectory)

    expect(definitions).toEqual([
      {
        description: 'Diff-focused review guidance.',
        id: 'code-review-diff',
        keywords: ['diff', 'pull-request'],
        prompt: 'Focus on the change set.',
      },
    ])
  })

  it('skips nested directories that are not immediate skill packages', async () => {
    const skillDirectory = join(rootDirectory, 'jira.triage', 'skills', 'jira-classify')
    await mkdir(skillDirectory, { recursive: true })
    await writeFile(
      join(skillDirectory, 'skill.toml'),
      [
        'id = "jira-classify"',
        'description = "Jira classification guidance."',
        'prompt_file = "prompt.md"',
        '',
      ].join('\n'),
      'utf8',
    )
    await writeFile(join(skillDirectory, 'prompt.md'), 'Classify the issue.\n', 'utf8')

    const loader = new SkillDefinitionLoader(new TomlDecoder())

    await expect(loader.loadFromRootDirectory(rootDirectory)).resolves.toEqual([])
  })

  it('rethrows non-ENOENT errors when reading skill roots', async () => {
    const loader = new SkillDefinitionLoader(new TomlDecoder())
    const filePath = join(rootDirectory, 'not-a-directory')
    await writeFile(filePath, 'x', 'utf8')

    await expect(loader.loadFromRootDirectory(filePath)).rejects.toBeTruthy()
  })

  it('returns an empty list when the root directory is missing', async () => {
    const loader = new SkillDefinitionLoader(new TomlDecoder())

    await expect(
      loader.loadFromRootDirectory(join(rootDirectory, 'missing')),
    ).resolves.toEqual([])
  })

  it('rejects invalid skill manifests', async () => {
    const skillDirectory = join(rootDirectory, 'broken')

    await mkdir(skillDirectory)
    await writeFile(join(skillDirectory, 'skill.toml'), 'id = ""\n', 'utf8')

    const loader = new SkillDefinitionLoader(new TomlDecoder())

    await expect(loader.loadFromRootDirectory(rootDirectory)).rejects.toThrow(
      /Failed to load skill from directory: broken/,
    )
  })

  it('rejects empty skill prompt files', async () => {
    const skillDirectory = join(rootDirectory, 'empty-prompt')

    await mkdir(skillDirectory)
    await writeFile(
      join(skillDirectory, 'skill.toml'),
      [
        'id = "empty-prompt"',
        'description = "Empty prompt skill."',
        'prompt_file = "prompt.md"',
        '',
      ].join('\n'),
      'utf8',
    )
    await writeFile(join(skillDirectory, 'prompt.md'), '   \n', 'utf8')

    const loader = new SkillDefinitionLoader(new TomlDecoder())

    await expect(loader.loadFromRootDirectory(rootDirectory)).rejects.toThrow(
      /Failed to load skill from directory: empty-prompt/,
    )
  })

  it('ignores non-directory entries in the skills root', async () => {
    await writeFile(join(rootDirectory, 'README.md'), '# skills\n', 'utf8')

    const loader = new SkillDefinitionLoader(new TomlDecoder())

    await expect(loader.loadFromRootDirectory(rootDirectory)).resolves.toEqual([])
  })

  it('validates the skill schema shape', () => {
    expect(() =>
      skillSchema.parse({
        description: 'Diff-focused review guidance.',
        id: 'code-review-diff',
      }),
    ).toThrow()
  })
})
