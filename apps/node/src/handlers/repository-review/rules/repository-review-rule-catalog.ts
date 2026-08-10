// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { RepositoryReviewGuidelineDocument } from '../composer/repository-review-guideline-loader'

/**
 * Severity extracted from a project rule heading, when present.
 */
export type ProjectReviewRuleSeverity = 'blocker' | 'high' | 'medium' | 'low' | 'unknown'

/**
 * One parseable project review rule from repository guideline / skill docs.
 */
export interface ProjectReviewRule {
  /**
   * Stable rule identifier (for example `TV-TEST-051` or `CX-TEST-001`).
   */
  readonly id: string

  /**
   * Severity tag from the heading, or `unknown` when absent.
   */
  readonly severity: ProjectReviewRuleSeverity

  /**
   * Repository-relative path of the document that defined the rule.
   */
  readonly sourcePath: string

  /**
   * Human-readable title from the heading (severity tag stripped).
   */
  readonly title: string
}

/**
 * Heading shape: `### TV-TEST-051 — Title \`[HIGH]\`` (severity optional).
 */
const RULE_HEADING_PATTERN =
  /^#{2,6}\s+([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\s*[—–:-]\s*(.+?)\s*$/gm

/**
 * Optional severity suffix on a rule title (`[HIGH]` or `` `[HIGH]` ``).
 */
const SEVERITY_SUFFIX_PATTERN = /\s*`?\[(BLOCKER|HIGH|MEDIUM|LOW|CRITICAL)\]`?\s*$/i

/**
 * Parses project review rules from loaded guideline documents.
 *
 * Empty when no parseable rule headings exist — callers must not invent rules.
 *
 * @param documents - Host-loaded markdown / rule documents from the workspace.
 * @returns Deduplicated catalog ordered by first appearance.
 */
export function parseProjectReviewRuleCatalog(
  documents: readonly RepositoryReviewGuidelineDocument[],
): readonly ProjectReviewRule[] {
  const rules: ProjectReviewRule[] = []
  const seen = new Set<string>()

  for (const document of documents) {
    for (const match of document.contents.matchAll(RULE_HEADING_PATTERN)) {
      const id = match[1]?.trim()
      const rawTitle = match[2]?.trim()

      if (!id || !rawTitle || seen.has(id)) {
        continue
      }

      const severityMatch = rawTitle.match(SEVERITY_SUFFIX_PATTERN)
      const title = severityMatch ? rawTitle.replace(SEVERITY_SUFFIX_PATTERN, '').trim() : rawTitle
      const severity = normalizeSeverity(severityMatch?.[1])

      if (title.length === 0) {
        continue
      }

      seen.add(id)
      rules.push({
        id,
        severity,
        sourcePath: document.path,
        title,
      })
    }
  }

  return rules
}

/**
 * Flattens guideline collections into a single document list for catalog parsing.
 */
export function flattenGuidelineDocuments(input: {
  readonly agentsDocuments: readonly RepositoryReviewGuidelineDocument[]
  readonly agentSkillDocuments: readonly RepositoryReviewGuidelineDocument[]
  readonly cursorRuleDocuments: readonly RepositoryReviewGuidelineDocument[]
  readonly referencedDocuments: readonly RepositoryReviewGuidelineDocument[]
}): readonly RepositoryReviewGuidelineDocument[] {
  return [
    ...input.agentsDocuments,
    ...input.agentSkillDocuments,
    ...input.cursorRuleDocuments,
    ...input.referencedDocuments,
  ]
}

function normalizeSeverity(value: string | undefined): ProjectReviewRuleSeverity {
  switch (value?.toUpperCase()) {
    case 'BLOCKER':
    case 'CRITICAL':
      return 'blocker'
    case 'HIGH':
      return 'high'
    case 'MEDIUM':
      return 'medium'
    case 'LOW':
      return 'low'
    default:
      return 'unknown'
  }
}
