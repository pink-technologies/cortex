// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ProjectReviewRule } from './repository-review-rule-catalog'

/**
 * Maximum applicable rules injected into a single review prompt.
 */
const DEFAULT_MAX_APPLICABLE_RULES = 40

/**
 * Selects project rules that apply to the current change set.
 *
 * Prefer rules whose source document / id family overlaps with changed paths.
 * When no paths are available, keep only high/blocker rules (capped). Empty
 * catalog → empty applicable set (no invented rules).
 *
 * @param catalog - Parsed project rule catalog.
 * @param changedPaths - Repository-relative paths from the merge-base diff.
 * @param maxRules - Cap on how many rules are injected / scored.
 */
export function selectApplicableRepositoryReviewRules(
  catalog: readonly ProjectReviewRule[],
  changedPaths: readonly string[],
  maxRules: number = DEFAULT_MAX_APPLICABLE_RULES,
): readonly ProjectReviewRule[] {
  if (catalog.length === 0 || maxRules <= 0) {
    return []
  }

  const normalizedPaths = changedPaths.map((path) => path.replace(/\\/g, '/'))

  if (normalizedPaths.length === 0) {
    return prioritizeRules(catalog.filter((rule) => isElevatedSeverity(rule.severity))).slice(
      0,
      maxRules,
    )
  }

  const pathHaystack = normalizedPaths.join('\n').toLowerCase()
  const scored = catalog.map((rule) => ({
    rule,
    score: relevanceScore(rule, pathHaystack, normalizedPaths),
  }))

  const relevant = scored.filter((entry) => entry.score > 0)

  if (relevant.length === 0) {
    return prioritizeRules(catalog.filter((rule) => isElevatedSeverity(rule.severity))).slice(
      0,
      maxRules,
    )
  }

  relevant.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score
    }

    return severityRank(right.rule.severity) - severityRank(left.rule.severity)
  })

  return relevant.slice(0, maxRules).map((entry) => entry.rule)
}

function relevanceScore(
  rule: ProjectReviewRule,
  pathHaystack: string,
  changedPaths: readonly string[],
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

  if (isElevatedSeverity(rule.severity) && score > 0) {
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

function prioritizeRules(rules: readonly ProjectReviewRule[]): ProjectReviewRule[] {
  return [...rules].sort((left, right) => {
    const severityDelta = severityRank(right.severity) - severityRank(left.severity)

    if (severityDelta !== 0) {
      return severityDelta
    }

    return left.id.localeCompare(right.id)
  })
}

function isElevatedSeverity(severity: ProjectReviewRule['severity']): boolean {
  return severity === 'blocker' || severity === 'high'
}

function severityRank(severity: ProjectReviewRule['severity']): number {
  switch (severity) {
    case 'blocker':
      return 4
    case 'high':
      return 3
    case 'medium':
      return 2
    case 'low':
      return 1
    default:
      return 0
  }
}
