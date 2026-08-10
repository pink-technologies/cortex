// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { RepositoryReviewMode } from '@cortex/protocol'
import {
  formatRepositoryReviewGuidelines,
  loadRepositoryReviewGuidelines,
  type RepositoryReviewGuidelines,
} from './repository-review-guideline-loader'
import { formatRepositoryReviewApplicableRules } from '../rules/format-repository-review-applicable-rules'
import { listRepositoryReviewChangedPaths } from '../rules/list-repository-review-changed-paths'
import {
  flattenGuidelineDocuments,
  parseProjectReviewRuleCatalog,
  type ProjectReviewRule,
} from '../rules/repository-review-rule-catalog'
import { selectApplicableRepositoryReviewRules } from '../rules/select-applicable-repository-review-rules'
import {
  loadRepositoryReviewScoringConfig,
  type RepositoryReviewScoringConfig,
} from '../rules/repository-review-scoring-config'

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
 * Reads host-side repository guidelines and applicable project rules for a run.
 *
 * @param workspacePath - Absolute path to the prepared repository workspace.
 * @param mergeBaseSha - Optional merge-base SHA used to list changed paths.
 * @param signal - Optional abort signal for git path listing.
 */
export async function loadRepositoryReviewPromptContext(
  workspacePath: string,
  mergeBaseSha?: string,
  signal?: AbortSignal,
): Promise<{
  readonly applicableRules: readonly ProjectReviewRule[]
  readonly applicableRulesPrompt: string | undefined
  readonly guidelines: RepositoryReviewGuidelines
  readonly guidelinesPrompt: string | undefined
  readonly scoringConfig: RepositoryReviewScoringConfig
}> {
  const guidelines = await loadRepositoryReviewGuidelines(workspacePath)
  const guidelinesPrompt = formatRepositoryReviewGuidelines(guidelines)
  const scoringConfig = await loadRepositoryReviewScoringConfig(workspacePath)
  const catalog = parseProjectReviewRuleCatalog(flattenGuidelineDocuments(guidelines))
  const changedPaths = await listRepositoryReviewChangedPaths(workspacePath, mergeBaseSha, signal)
  const applicableRules = selectApplicableRepositoryReviewRules(catalog, changedPaths, scoringConfig)
  const applicableRulesPrompt = formatRepositoryReviewApplicableRules(applicableRules)

  return {
    applicableRules,
    applicableRulesPrompt,
    guidelines,
    guidelinesPrompt,
    scoringConfig,
  }
}

/**
 * Reads host-side repository guidelines for prompt injection.
 *
 * Loads root/nested `AGENTS*` files, `.agents/skills`, `.cursor/rules`, and
 * referenced guideline paths from a prepared workspace.
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
 * applicable project rules, and run context.
 */
export function composeRepositoryReviewPrompt(input: {
  readonly applicableRulesPrompt?: string
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

  const applicableRules = input.applicableRulesPrompt?.trim()

  if (applicableRules) {
    sections.push(applicableRules)
  }

  sections.push(input.userContext.trim())

  return sections.join('\n\n')
}

export type { ProjectReviewRule, RepositoryReviewGuidelines, RepositoryReviewScoringConfig }
