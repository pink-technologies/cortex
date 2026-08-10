// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import { TomlLoader } from '../../../configuration/loaders/toml-loader'
import type { ProjectReviewRuleSeverity } from './repository-review-rule-catalog'

/**
 * Repository-relative path for optional project review scoring policy.
 */
export const RepositoryReviewScoringConfigRelativePath = '.cortex/review-scoring.toml' as const

/**
 * Severity keys that may appear in project scoring weights.
 */
const ReviewScoringSeveritySchema = z.enum(['blocker', 'high', 'medium', 'low', 'unknown'])

/**
 * Default scoring policy used when the reviewed repo has no scoring config.
 */
export const defaultRepositoryReviewScoringConfig = {
  /**
   * Severities that attract an extra fail penalty and elevated selection preference.
   */
  elevatedSeverities: ['blocker', 'high'] as const satisfies readonly ProjectReviewRuleSeverity[],

  /**
   * Extra score penalty applied per elevated-severity `fail` outcome.
   */
  elevatedFailPenalty: 0.05,

  /**
   * Maximum applicable rules injected into one review prompt / score checklist.
   */
  maxApplicableRules: 40,

  /**
   * Config schema version for the reviewed repository file.
   */
  schemaVersion: 1 as const,

  /**
   * Per-severity weights for the weighted pass-rate numerator/denominator.
   */
  weights: {
    blocker: 4,
    high: 3,
    low: 1,
    medium: 2,
    unknown: 2,
  },
} as const

/**
 * Validates `.cortex/review-scoring.toml` from a reviewed repository.
 *
 * Omitted fields fall back to {@link defaultRepositoryReviewScoringConfig}.
 */
export const RepositoryReviewScoringConfigSchema = z
  .object({
    elevatedFailPenalty: z
      .number()
      .min(0)
      .max(1)
      .default(defaultRepositoryReviewScoringConfig.elevatedFailPenalty),

    elevatedSeverities: z
      .array(ReviewScoringSeveritySchema)
      .min(1)
      .default([...defaultRepositoryReviewScoringConfig.elevatedSeverities]),

    maxApplicableRules: z
      .number()
      .int()
      .positive()
      .max(200)
      .default(defaultRepositoryReviewScoringConfig.maxApplicableRules),

    schemaVersion: z.literal(1).default(1),

    weights: z
      .object({
        blocker: z.number().positive().default(defaultRepositoryReviewScoringConfig.weights.blocker),
        high: z.number().positive().default(defaultRepositoryReviewScoringConfig.weights.high),
        low: z.number().positive().default(defaultRepositoryReviewScoringConfig.weights.low),
        medium: z.number().positive().default(defaultRepositoryReviewScoringConfig.weights.medium),
        unknown: z.number().positive().default(defaultRepositoryReviewScoringConfig.weights.unknown),
      })
      .strict()
      .default({ ...defaultRepositoryReviewScoringConfig.weights }),
  })
  .strict()

/**
 * Project-owned scoring policy for repository reviews.
 */
export type RepositoryReviewScoringConfig = z.infer<typeof RepositoryReviewScoringConfigSchema>

/**
 * Loads project scoring policy from the prepared review workspace.
 *
 * Missing `.cortex/review-scoring.toml` returns Cortex defaults. A present but
 * invalid file fails closed so misconfiguration is visible.
 *
 * @param workspacePath - Absolute path to the prepared repository workspace.
 */
export async function loadRepositoryReviewScoringConfig(
  workspacePath: string,
): Promise<RepositoryReviewScoringConfig> {
  const absolutePath = join(workspacePath, RepositoryReviewScoringConfigRelativePath)

  try {
    await access(absolutePath)
  } catch {
    return {
      elevatedFailPenalty: defaultRepositoryReviewScoringConfig.elevatedFailPenalty,
      elevatedSeverities: [...defaultRepositoryReviewScoringConfig.elevatedSeverities],
      maxApplicableRules: defaultRepositoryReviewScoringConfig.maxApplicableRules,
      schemaVersion: defaultRepositoryReviewScoringConfig.schemaVersion,
      weights: { ...defaultRepositoryReviewScoringConfig.weights },
    }
  }

  const loader = new TomlLoader()
  return loader.load(absolutePath, (value) => RepositoryReviewScoringConfigSchema.parse(value))
}
