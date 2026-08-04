// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { RepositoryReviewMode } from '@cortex/protocol'
import {
  formatRepositoryReviewGuidelines,
  loadRepositoryReviewGuidelines,
  type RepositoryReviewGuidelines,
} from './repository-review-guideline-loader'

/**
 * Skill always injected for `repository.review` runs.
 */
export const RepositoryReviewDiffSkillId = 'code-review-diff' as const

/**
 * Builds the per-run user context for a repository review (refs, PR, instructions).
 */
export function buildRepositoryReviewUserContext(input: {
  readonly baseRef?: string
  readonly headRef: string
  readonly instructions?: string
  readonly mergeBaseSha?: string
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

  if (input.mergeBaseSha) {
    lines.push(`Merge base SHA: ${input.mergeBaseSha}.`)
    lines.push(
      'Authoritative change set: review `git diff --merge-base` / three-dot range ' +
        `\`${input.mergeBaseSha}...HEAD\` (changes introduced by the head revision since it diverged from the base).`,
    )
  } else if (input.baseRef) {
    lines.push(
      'Merge base could not be resolved locally. Report that limitation and avoid claiming a complete PR-style change set was reviewed.',
    )
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
 * Reads host-side repository guidelines for prompt injection.
 *
 * Loads root/nested `AGENTS*` files, `.cursor/rules`, and referenced guideline
 * paths from a prepared workspace.
 *
 * @param workspacePath - Absolute path to the prepared repository workspace.
 * @returns Formatted guidelines section, or `undefined` when none exist.
 */
export async function readRepositoryReviewGuidelinesPrompt(
  workspacePath: string,
): Promise<string | undefined> {
  const guidelines = await loadRepositoryReviewGuidelines(workspacePath)
  return formatRepositoryReviewGuidelines(guidelines)
}

/**
 * Composes the full engine prompt from agent, skills, host-loaded guidelines,
 * and run context.
 */
export function composeRepositoryReviewPrompt(input: {
  readonly guidelinesPrompt?: string
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

  const guidelines = input.guidelinesPrompt?.trim()

  if (guidelines) {
    if (guidelines.startsWith('## ')) {
      sections.push(guidelines)
    } else {
      sections.push(`## Repository agent guidelines\n\n${guidelines}`)
    }
  }

  sections.push(input.userContext.trim())

  return sections.join('\n\n')
}

export type { RepositoryReviewGuidelines }
