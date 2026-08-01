// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { RepositoryReviewMode } from '@cortex/protocol'

/**
 * Relative paths checked for repository agent guidelines, in preference order.
 */
const AGENTS_MARKDOWN_CANDIDATES = ['AGENTS.md', join('.cursor', 'AGENTS.md')] as const

/**
 * Builds the per-run user context for a repository review (refs, PR, instructions).
 */
export function buildRepositoryReviewUserContext(input: {
  readonly baseRef?: string
  readonly headRef: string
  readonly instructions?: string
  readonly pullRequestBody?: string
  readonly pullRequestTitle?: string
  readonly reviewMode: RepositoryReviewMode
}): string {
  const lines = [
    '## Review run context',
    `Review mode: ${input.reviewMode}.`,
    `Head revision: ${input.headRef}.`,
  ]

  if (input.baseRef) {
    lines.push(`Base revision: ${input.baseRef}.`)
  }

  if (input.pullRequestTitle) {
    lines.push(`Pull request title: ${input.pullRequestTitle}.`)
  }

  if (input.pullRequestBody) {
    lines.push(`Pull request body:\n${input.pullRequestBody}`)
  }

  if (input.instructions) {
    lines.push(`Additional reviewer instructions:\n${input.instructions}`)
  }

  return lines.join('\n')
}

/**
 * Reads optional repository `AGENTS.md` guidelines from a workspace root.
 *
 * @param workspacePath - Absolute path to the prepared repository workspace.
 * @returns File contents when present; otherwise `undefined`.
 */
export async function readAgentsMarkdown(workspacePath: string): Promise<string | undefined> {
  for (const relativePath of AGENTS_MARKDOWN_CANDIDATES) {
    const absolutePath = join(workspacePath, relativePath)

    try {
      await access(absolutePath)
      const contents = (await readFile(absolutePath, 'utf8')).trim()

      if (contents.length > 0) {
        return contents
      }
    } catch {
      // try next candidate
    }
  }

  return undefined
}

/**
 * Composes the full engine prompt from agent, skills, optional AGENTS.md, and
 * run context.
 */
export function composeRepositoryReviewPrompt(input: {
  readonly agentsMarkdown?: string
  readonly skillPrompts?: readonly string[]
  readonly systemPrompt: string
  readonly userContext: string
}): string {
  const sections = [input.systemPrompt.trim()]

  for (const skillPrompt of input.skillPrompts ?? []) {
    const trimmed = skillPrompt.trim()

    if (trimmed.length > 0) {
      sections.push(`## Authorized skill\n\n${trimmed}`)
    }
  }

  if (input.agentsMarkdown?.trim()) {
    sections.push(`## Repository agent guidelines\n\n${input.agentsMarkdown.trim()}`)
  }

  sections.push(input.userContext.trim())

  return sections.join('\n\n')
}
