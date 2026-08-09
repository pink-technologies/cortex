// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraProjectRepoArea } from '../../../connection'
import type { ResolvedJiraRepository } from '../models'

/**
 * Optional routing inputs when selecting named suites for a triage run.
 */
export type ResolveAllowlistedSuitesInput = {
  /**
   * Free-text ticket content used when {@link selectedAreas} is empty.
   */
  readonly issueText?: string

  /**
   * Area labels from classification (allowlisted ids or aliases).
   */
  readonly selectedAreas?: readonly string[]
}

/**
 * Builds the allowlisted suite id → command map for a resolved repository.
 *
 * Prefers a named {@link ResolvedJiraRepository.suites} catalog when present
 * and non-empty. Otherwise falls back to legacy `unit` / `ui` commands.
 *
 * When areas are configured, suite selection prefers:
 * 1. Classification {@link ResolveAllowlistedSuitesInput.selectedAreas}
 * 2. Alias / area-id matches in {@link ResolveAllowlistedSuitesInput.issueText}
 * 3. All named suites (no confident area match)
 *
 * @param repository - Resolved clone target and suite configuration.
 * @param input - Optional area routing signals from classify / ticket text.
 * @returns Suite commands keyed by suite id; empty when nothing is configured.
 */
export function resolveAllowlistedSuites(
  repository: ResolvedJiraRepository,
  input: ResolveAllowlistedSuitesInput = {},
): Readonly<Record<string, string>> {
  const namedEntries = Object.entries(repository.suites ?? {}).filter(([, suite]) =>
    Boolean(suite.command),
  )

  if (namedEntries.length === 0) {
    return legacySuites(repository)
  }

  const catalog = Object.fromEntries(
    namedEntries.map(([suiteId, suite]) => [suiteId, suite.command]),
  )
  const areaCatalog = repository.areas ?? {}
  const areaIds = resolveAreaIds({
    areaCatalog,
    issueText: input.issueText ?? '',
    selectedAreas: input.selectedAreas ?? [],
  })

  if (areaIds.length === 0) {
    return catalog
  }

  const suiteKeys = new Set<string>()

  for (const areaId of areaIds) {
    const area = areaCatalog[areaId]

    if (area) {
      for (const suiteKey of area.suiteKeys) {
        if (catalog[suiteKey]) {
          suiteKeys.add(suiteKey)
        }
      }
      continue
    }

    if (catalog[areaId]) {
      suiteKeys.add(areaId)
    }
  }

  if (suiteKeys.size === 0) {
    return catalog
  }

  return Object.fromEntries(
    [...suiteKeys].map((suiteId) => [suiteId, catalog[suiteId]!]),
  )
}

function legacySuites(repository: ResolvedJiraRepository): Readonly<Record<string, string>> {
  const legacy: Record<string, string> = {}

  if (repository.unitTestCommand) {
    legacy.unit = repository.unitTestCommand
  }

  if (repository.uiTestCommand) {
    legacy.ui = repository.uiTestCommand
  }

  return legacy
}

function resolveAreaIds(input: {
  readonly areaCatalog: Readonly<Record<string, JiraProjectRepoArea>>
  readonly issueText: string
  readonly selectedAreas: readonly string[]
}): readonly string[] {
  const fromClassification = uniqueCanonicalAreas(input.selectedAreas, input.areaCatalog)

  if (fromClassification.length > 0) {
    return fromClassification
  }

  if (!input.issueText.trim() || Object.keys(input.areaCatalog).length === 0) {
    return []
  }

  return matchAreasInText(input.issueText, input.areaCatalog)
}

function uniqueCanonicalAreas(
  selectedAreas: readonly string[],
  areaCatalog: Readonly<Record<string, JiraProjectRepoArea>>,
): readonly string[] {
  const resolved: string[] = []

  for (const selected of selectedAreas) {
    const canonical = findCanonicalAreaId(selected, areaCatalog)

    if (canonical && !resolved.includes(canonical)) {
      resolved.push(canonical)
    }
  }

  return resolved
}

function matchAreasInText(
  issueText: string,
  areaCatalog: Readonly<Record<string, JiraProjectRepoArea>>,
): readonly string[] {
  const matched: string[] = []

  for (const [areaId, area] of Object.entries(areaCatalog)) {
    const needles = [areaId, ...(area.aliases ?? [])]

    if (needles.some((needle) => textMentions(issueText, needle))) {
      matched.push(areaId)
    }
  }

  return matched
}

function findCanonicalAreaId(
  value: string,
  areaCatalog: Readonly<Record<string, JiraProjectRepoArea>>,
): string | undefined {
  const normalized = value.trim().toLowerCase()

  if (!normalized) {
    return undefined
  }

  for (const [areaId, area] of Object.entries(areaCatalog)) {
    if (areaId.toLowerCase() === normalized) {
      return areaId
    }

    if ((area.aliases ?? []).some((alias) => alias.toLowerCase() === normalized)) {
      return areaId
    }
  }

  return undefined
}

function textMentions(haystack: string, needle: string): boolean {
  const trimmed = needle.trim()

  if (!trimmed) {
    return false
  }

  if (trimmed.length <= 3) {
    return new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, 'i').test(haystack)
  }

  return haystack.toLowerCase().includes(trimmed.toLowerCase())
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
