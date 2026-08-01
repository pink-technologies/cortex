// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  buildRepositoryReviewUserContext,
  composeRepositoryReviewPrompt,
  mapRepositoryReviewResult,
  readAgentsMarkdown,
} from '../../../../src/handlers'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('mapRepositoryReviewResult', () => {
  it('parses a fenced JSON review result', () => {
    const output = [
      'Here is the review:',
      '```json',
      JSON.stringify({
        findings: [
          {
            detail: 'Avoid force unwrap.',
            path: 'src/main.ts',
            severity: 'warning',
            startLine: 10,
            title: 'Unsafe unwrap',
          },
        ],
        reviewMode: 'diff',
        summary: 'One warning found.',
      }),
      '```',
    ].join('\n')

    expect(mapRepositoryReviewResult(output, 'diff')).toEqual({
      findings: [
        {
          detail: 'Avoid force unwrap.',
          path: 'src/main.ts',
          severity: 'warning',
          startLine: 10,
          title: 'Unsafe unwrap',
        },
      ],
      reviewMode: 'diff',
      summary: 'One warning found.',
    })
  })

  it('injects reviewMode when the engine omits it', () => {
    const output = JSON.stringify({
      findings: [],
      summary: 'Clean review.',
    })

    expect(mapRepositoryReviewResult(output, 'full')).toEqual({
      findings: [],
      reviewMode: 'full',
      summary: 'Clean review.',
    })
  })

  it('rejects invalid JSON', () => {
    expect(() => mapRepositoryReviewResult('not-json', 'diff')).toThrow(
      /not valid JSON/,
    )
  })

  it('rejects JSON that fails the protocol schema', () => {
    expect(() =>
      mapRepositoryReviewResult(
        JSON.stringify({
          findings: [],
          summary: '',
        }),
        'diff',
      ),
    ).toThrow()
  })
})

describe('buildRepositoryReviewUserContext', () => {
  it('includes mode, refs, and instructions', () => {
    const context = buildRepositoryReviewUserContext({
      baseRef: 'main',
      headRef: 'feature',
      instructions: 'Focus on security.',
      pullRequestBody: 'Implements login.',
      pullRequestTitle: 'Add login',
      reviewMode: 'diff',
    })

    expect(context).toContain('Review mode: diff.')
    expect(context).toContain('Head revision: feature.')
    expect(context).toContain('Base revision: main.')
    expect(context).toContain('Focus on security.')
    expect(context).toContain('Implements login.')
    expect(context).toContain('Add login')
  })
})

describe('composeRepositoryReviewPrompt', () => {
  it('always includes the agent system prompt and user context', () => {
    const prompt = composeRepositoryReviewPrompt({
      systemPrompt: 'You are the repository reviewer.',
      userContext: 'Review mode: diff.',
    })

    expect(prompt).toContain('You are the repository reviewer.')
    expect(prompt).toContain('Review mode: diff.')
    expect(prompt).not.toContain('Repository agent guidelines')
  })

  it('injects AGENTS.md and skill prompts when provided', () => {
    const prompt = composeRepositoryReviewPrompt({
      agentsMarkdown: 'Prefer early returns.',
      skillPrompts: ['# Diff review skill\nFocus on the change set.'],
      systemPrompt: 'System',
      userContext: 'Context',
    })

    expect(prompt).toContain('Repository agent guidelines')
    expect(prompt).toContain('Prefer early returns.')
    expect(prompt).toContain('Authorized skill')
    expect(prompt).toContain('Focus on the change set.')
  })
})

describe('readAgentsMarkdown', () => {
  let workspacePath: string

  beforeEach(async () => {
    workspacePath = await mkdtemp(join(tmpdir(), 'cortex-agents-md-'))
  })

  afterEach(async () => {
    await rm(workspacePath, { force: true, recursive: true })
  })

  it('returns undefined when no AGENTS.md is present', async () => {
    await expect(readAgentsMarkdown(workspacePath)).resolves.toBeUndefined()
  })

  it('reads AGENTS.md from the workspace root', async () => {
    await writeFile(join(workspacePath, 'AGENTS.md'), 'Use strict typing.\n', 'utf8')

    await expect(readAgentsMarkdown(workspacePath)).resolves.toBe('Use strict typing.')
  })

  it('falls back to .cursor/AGENTS.md', async () => {
    await mkdir(join(workspacePath, '.cursor'), { recursive: true, mode: 0o755 })
    await writeFile(
      join(workspacePath, '.cursor', 'AGENTS.md'),
      'Cursor-local guidelines.\n',
      'utf8',
    )

    await expect(readAgentsMarkdown(workspacePath)).resolves.toBe('Cursor-local guidelines.')
  })
})
