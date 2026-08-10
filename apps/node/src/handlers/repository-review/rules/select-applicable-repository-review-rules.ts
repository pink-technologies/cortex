// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ProjectReviewRule, ProjectReviewRuleSeverity } from './repository-review-rule-catalog'
import {
  defaultRepositoryReviewScoringConfig,
  type RepositoryReviewScoringConfig,
} from './repository-review-scoring-config'

/**
 * Selects project rules that apply to the current change set.
 *
 * Prefer rules whose source document / id family overlaps with changed paths.
 * When no paths are available, keep only elevated-severity rules (capped). Empty
 * catalog → empty applicable set (no invented rules).
 *
 * @param catalog - Parsed project rule catalog.
 * @param changedPaths - Repository-relative paths from the merge-base diff.
 * @param scoringConfig - Project scoring policy controlling caps and elevated severities.
 */
export function selectApplicableRepositoryReviewRules(
  catalog: readonly ProjectReviewRule[],
  changedPaths: readonly string[],
  scoringConfig: RepositoryReviewScoringConfig = {
    elevatedFailPenalty: defaultRepositoryReviewScoringConfig.elevatedFailPenalty,
    elevatedSeverities: [...defaultRepositoryReviewScoringConfig.elevatedSeverities],
    maxApplicableRules: defaultRepositoryReviewScoringConfig.maxApplicableRules,
    schemaVersion: defaultRepositoryReviewScoringConfig.schemaVersion,
    weights: { ...defaultRepositoryReviewScoringConfig.weights },
  },
): readonly ProjectReviewRule[] {
  const maxRules = scoringConfig.maxApplicableRules
  const elevated = new Set(scoringConfig.elevatedSeverities)

  if (catalog.length === 0 || maxRules <= 0) {
    return []
  }

  const normalizedPaths = changedPaths.map((path) => path.replace(/\\/g, '/'))

  if (normalizedPaths.length === 0) {
    return prioritizeRules(
      catalog.filter((rule) => elevated.has(rule.severity)),
      scoringConfig.weights,
    ).slice(0, maxRules)
  }

  const pathHaystack = normalizedPaths.join('\n').toLowerCase()
  const scored = catalog.map((rule) => ({
    rule,
    score: relevanceScore(rule, pathHaystack, normalizedPaths, elevated),
  }))

  const relevant = scored.filter((entry) => entry.score > 0)

  if (relevant.length === 0) {
    return prioritizeRules(
      catalog.filter((rule) => elevated.has(rule.severity)),
      scoringConfig.weights,
    ).slice(0, maxRules)
  }

  relevant.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score
    }

    return (
      severityRank(right.rule.severity, scoringConfig.weights) -
      severityRank(left.rule.severity, scoringConfig.weights)
    )
  })

  return relevant.slice(0, maxRules).map((entry) => entry.rule)
}

function relevanceScore(
  rule: ProjectReviewRule,
  pathHaystack: string,
  changedPaths: readonly string[],
  elevated: ReadonlySet<string>,
): number {
  let score = 0
  const sourceTokens = tokenize(rule.sourcePath)
  const idTokens = tokenize(rule.id)
  const titleTokens = tokenize(rule.title)

  for (const token of sourceTokens) {
    if (token.length < 3) {
      continue
    }

    if (pathHaystack.includes(token) || changedPaths.some((path) => pathIncludesToken(path, token))) {
      score += 3
    }
  }

  for (const token of [...idTokens, ...titleTokens]) {
    if (token.length < 3) {
      continue
    }

    if (pathHaystack.includes(token) || changedPaths.some((path) => pathIncludesToken(path, token))) {
      score += 2
    }
  }

  // Family heuristics: TEST rules apply to test / UITest surfaces.
  if (rule.id.includes('-TEST-') || rule.id.includes('-TEST_')) {
    if (/(uitest|ui_test|\/tests?\/|spec\.|test\.)/i.test(pathHaystack)) {
      score += 4
    }
  }

  if (elevated.has(rule.severity) && score > 0) {
    score += 1
  }

  return score
}

function pathIncludesToken(path: string, token: string): boolean {
  const lower = path.toLowerCase()
  return lower.includes(token) || lower.split(/[/_.-]/).includes(token)
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/g, '')
    .split(/[/_.\s—–-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !['md', 'mdc', 'references', 'skills', 'agents'].includes(token))
}

function prioritizeRules(
  rules: readonly ProjectReviewRule[],
  weights: RepositoryReviewScoringConfig['weights'],
): ProjectReviewRule[] {
  return [...rules].sort((left, right) => {
    const severityDelta = severityRank(right.severity, weights) - severityRank(left.severity, weights)

    if (severityDelta !== 0) {
      return severityDelta
    }

    return left.id.localeCompare(right.id)
  })
}

function severityRank(
  severity: ProjectReviewRuleSeverity,
  weights: RepositoryReviewScoringConfig['weights'],
): number {
  return weights[severity]
}
