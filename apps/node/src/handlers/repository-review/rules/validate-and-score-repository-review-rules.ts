// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type {
  RepositoryReviewJobResult,
  RepositoryReviewRuleOutcome,
  RepositoryReviewScore,
} from '@cortex/protocol'
import type { ProjectReviewRule } from './repository-review-rule-catalog'
import {
  defaultRepositoryReviewScoringConfig,
  type RepositoryReviewScoringConfig,
} from './repository-review-scoring-config'

/**
 * Normalizes engine `ruleOutcomes` against the host applicable set and attaches
 * a deterministic project-rule score.
 *
 * When `applicableRules` is empty, returns the result unchanged (no invented
 * score). Otherwise:
 * - ensures every applicable id has an outcome
 * - upgrades to `fail` when findings cite the rule
 * - downgrades dishonest `fail` outcomes that lack citing findings
 * - drops outcomes for unknown (non-applicable) rule ids
 * - computes `score` from severity-weighted pass rate using
 *   {@link RepositoryReviewScoringConfig}
 *
 * @param result - Schema-validated engine result.
 * @param applicableRules - Host-selected applicable project rules.
 * @param scoringConfig - Project scoring policy (defaults when omitted).
 */
export function validateAndScoreRepositoryReviewRules(
  result: RepositoryReviewJobResult,
  applicableRules: readonly ProjectReviewRule[],
  scoringConfig: RepositoryReviewScoringConfig = {
    elevatedFailPenalty: defaultRepositoryReviewScoringConfig.elevatedFailPenalty,
    elevatedSeverities: [...defaultRepositoryReviewScoringConfig.elevatedSeverities],
    maxApplicableRules: defaultRepositoryReviewScoringConfig.maxApplicableRules,
    schemaVersion: defaultRepositoryReviewScoringConfig.schemaVersion,
    weights: { ...defaultRepositoryReviewScoringConfig.weights },
  },
): RepositoryReviewJobResult {
  if (applicableRules.length === 0) {
    return {
      ...result,
      ruleOutcomes: [],
      score: undefined,
    }
  }

  const applicableById = new Map(applicableRules.map((rule) => [rule.id, rule]))
  const engineByRuleId = new Map(
    result.ruleOutcomes
      .filter((outcome) => applicableById.has(outcome.ruleId))
      .map((outcome) => [outcome.ruleId, outcome] as const),
  )
  const elevated = new Set(scoringConfig.elevatedSeverities)

  const normalized: RepositoryReviewRuleOutcome[] = []

  for (const rule of applicableRules) {
    const citingFindings = result.findings.filter((finding) => finding.ruleIds.includes(rule.id))
    const engineOutcome = engineByRuleId.get(rule.id)

    if (citingFindings.length > 0) {
      normalized.push({
        findingIds: citingFindings.map((finding) => finding.id),
        reason: engineOutcome?.reason,
        ruleId: rule.id,
        status: 'fail',
      })
      continue
    }

    if (!engineOutcome) {
      normalized.push({
        findingIds: [],
        reason: 'Host checklist id missing from engine ruleOutcomes.',
        ruleId: rule.id,
        status: 'not_reviewed',
      })
      continue
    }

    if (engineOutcome.status === 'fail') {
      const validFindingIds = engineOutcome.findingIds.filter((id) => {
        const finding = result.findings.find((candidate) => candidate.id === id)
        return finding !== undefined && finding.ruleIds.includes(rule.id)
      })

      if (validFindingIds.length === 0) {
        normalized.push({
          findingIds: [],
          reason:
            engineOutcome.reason ?? 'Engine marked fail without findings that cite this rule id.',
          ruleId: rule.id,
          status: 'not_reviewed',
        })
        continue
      }

      normalized.push({
        findingIds: validFindingIds,
        reason: engineOutcome.reason,
        ruleId: rule.id,
        status: 'fail',
      })
      continue
    }

    normalized.push({
      findingIds: [],
      reason: engineOutcome.reason,
      ruleId: rule.id,
      status: engineOutcome.status,
    })
  }

  return {
    ...result,
    ruleOutcomes: normalized,
    score: computeScore(normalized, applicableById, scoringConfig, elevated),
  }
}

function computeScore(
  outcomes: readonly RepositoryReviewRuleOutcome[],
  applicableById: ReadonlyMap<string, ProjectReviewRule>,
  scoringConfig: RepositoryReviewScoringConfig,
  elevated: ReadonlySet<string>,
): RepositoryReviewScore {
  let totalWeight = 0
  let passWeight = 0
  let passCount = 0
  let failCount = 0
  let notReviewedCount = 0
  let elevatedFailCount = 0
  const penalty = scoringConfig.elevatedFailPenalty

  for (const outcome of outcomes) {
    const rule = applicableById.get(outcome.ruleId)
    const weight = scoringConfig.weights[rule?.severity ?? 'unknown']
    totalWeight += weight

    switch (outcome.status) {
      case 'pass':
        passWeight += weight
        passCount += 1
        break
      case 'fail':
        failCount += 1
        if (rule && elevated.has(rule.severity)) {
          elevatedFailCount += 1
        }
        break
      case 'not_reviewed':
        notReviewedCount += 1
        break
    }
  }

  const raw = totalWeight === 0 ? 0 : passWeight / totalWeight
  const value = clamp01(raw - elevatedFailCount * penalty)
  const summary = [
    `Project-rule score over ${outcomes.length} applicable rule(s):`,
    `${passCount} pass, ${failCount} fail, ${notReviewedCount} not_reviewed`,
    `(weighted pass rate ${formatRatio(raw)}${
      elevatedFailCount > 0 ? `; −${formatRatio(elevatedFailCount * penalty)} elevated-fail penalty` : ''
    }).`,
  ].join(' ')

  return {
    summary,
    value: Number(value.toFixed(4)),
  }
}

function clamp01(value: number): number {
  if (value < 0) {
    return 0
  }

  if (value > 1) {
    return 1
  }

  return value
}

function formatRatio(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
