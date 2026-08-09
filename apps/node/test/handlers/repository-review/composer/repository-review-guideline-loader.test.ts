// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  formatRepositoryReviewGuidelines,
  loadRepositoryReviewGuidelines,
} from '../../../../src/handlers/repository-review/composer/repository-review-guideline-loader'

describe('loadRepositoryReviewGuidelines', () => {
  let workspacePath: string

  beforeEach(async () => {
    workspacePath = await mkdtemp(join(tmpdir(), 'cortex-review-guidelines-'))
  })

  afterEach(async () => {
    await rm(workspacePath, { force: true, recursive: true })
  })

  it('loads root AGENTS, nested AGENTS, cursor rules, and referenced files', async () => {
    await writeFile(join(workspacePath, 'AGENTS.md'), 'Root agents.\nSee [style](docs/style.md).\n', 'utf8')
    await mkdir(join(workspacePath, 'Libraries', 'Camera'), { recursive: true })
    await writeFile(join(workspacePath, 'Libraries', 'Camera', 'AGENTS.md'), 'Camera agents.\n', 'utf8')
    await mkdir(join(workspacePath, '.cursor', 'rules'), { recursive: true })
    await writeFile(join(workspacePath, '.cursor', 'rules', 'swift.mdc'), 'Prefer value types.\n', 'utf8')
    await mkdir(join(workspacePath, 'docs'), { recursive: true })
    await writeFile(join(workspacePath, 'docs', 'style.md'), 'Use early returns.\n', 'utf8')

    const guidelines = await loadRepositoryReviewGuidelines(workspacePath)
    const formatted = formatRepositoryReviewGuidelines(guidelines)

    expect(guidelines.agentsDocuments.map((document) => document.path)).toEqual(
      expect.arrayContaining(['AGENTS.md', 'Libraries/Camera/AGENTS.md']),
    )
    expect(guidelines.cursorRuleDocuments).toEqual([
      {
        contents: 'Prefer value types.',
        path: '.cursor/rules/swift.mdc',
      },
    ])
    expect(guidelines.referencedDocuments).toEqual([
      {
        contents: 'Use early returns.',
        path: 'docs/style.md',
      },
    ])
    expect(formatted).toContain('## Repository agent guidelines')
    expect(formatted).toContain('### AGENTS.md')
    expect(formatted).toContain('## Cursor rules')
    expect(formatted).toContain('## Referenced project guidelines')
  })

  it('returns empty collections when no guideline files exist', async () => {
    const guidelines = await loadRepositoryReviewGuidelines(workspacePath)

    expect(guidelines).toEqual({
      agentsDocuments: [],
      cursorRuleDocuments: [],
      referencedDocuments: [],
    })
    expect(formatRepositoryReviewGuidelines(guidelines)).toBeUndefined()
  })

  it('prefers AGENTS.override.md and ignores empty or unsafe references', async () => {
    await writeFile(
      join(workspacePath, 'AGENTS.override.md'),
      'Override wins.\nSee ../secret.md and https://example.com/a.md and ./AGENTS.md\nAlso docs/notes.mdc\n',
      'utf8',
    )
    await writeFile(join(workspacePath, 'AGENTS.md'), 'Default agents.\n', 'utf8')
    await writeFile(join(workspacePath, 'empty.md'), '   \n', 'utf8')
    await mkdir(join(workspacePath, 'docs'), { recursive: true })
    await writeFile(join(workspacePath, 'docs', 'notes.mdc'), 'Bare path notes.\n', 'utf8')
    await mkdir(join(workspacePath, 'node_modules', 'pkg'), { recursive: true })
    await writeFile(join(workspacePath, 'node_modules', 'pkg', 'AGENTS.md'), 'Ignored.\n', 'utf8')

    const guidelines = await loadRepositoryReviewGuidelines(workspacePath)

    expect(guidelines.agentsDocuments.map((document) => document.path)).toEqual(
      expect.arrayContaining(['AGENTS.override.md', 'AGENTS.md']),
    )
    expect(guidelines.agentsDocuments.some((document) => document.path.includes('node_modules'))).toBe(
      false,
    )
    expect(guidelines.referencedDocuments).toEqual([
      {
        contents: 'Bare path notes.',
        path: 'docs/notes.mdc',
      },
    ])
    expect(formatRepositoryReviewGuidelines(guidelines)).toContain('Override wins.')
  })

  it('skips symlink cycles while walking nested AGENTS files', async () => {
    const nested = join(workspacePath, 'pkg')
    await mkdir(nested, { recursive: true })
    await writeFile(join(nested, 'AGENTS.md'), 'Nested.\n', 'utf8')
    await symlink(workspacePath, join(nested, 'loop'))

    const guidelines = await loadRepositoryReviewGuidelines(workspacePath)

    expect(guidelines.agentsDocuments.some((document) => document.path === 'pkg/AGENTS.md')).toBe(true)
  })

  it('ignores empty root AGENTS.md and missing cursor rules directory', async () => {
    await writeFile(join(workspacePath, 'AGENTS.md'), '   \n', 'utf8')

    const guidelines = await loadRepositoryReviewGuidelines(workspacePath)

    expect(guidelines.agentsDocuments).toEqual([])
    expect(guidelines.cursorRuleDocuments).toEqual([])
  })
})
