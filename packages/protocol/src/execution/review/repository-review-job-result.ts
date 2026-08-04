// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Validates the severity assigned to a single review finding.
 *
 * - `blocker` — must be resolved before merge
 * - `high` — serious defect with strong merge pressure
 * - `medium` — meaningful issue that should be addressed
 * - `low` — minor issue or hardening suggestion
 */
export const RepositoryReviewSeveritySchema = z.enum(['blocker', 'high', 'medium', 'low'])

/**
 * Validated finding severity exchanged through the shared protocol.
 */
export type RepositoryReviewSeverity = z.infer<typeof RepositoryReviewSeveritySchema>

/**
 * Validates how a finding should be treated relative to merge readiness.
 *
 * - `required_before_merge` — block merge until resolved
 * - `product_decision` — needs an explicit product/API ownership decision
 * - `follow_up` — may ship with a tracked follow-up
 */
export const RepositoryReviewDispositionSchema = z.enum([
  'required_before_merge',
  'product_decision',
  'follow_up',
])

/**
 * Validated finding disposition exchanged through the shared protocol.
 */
export type RepositoryReviewDisposition = z.infer<typeof RepositoryReviewDispositionSchema>

/**
 * Validates the technical category of a review finding.
 */
export const RepositoryReviewCategorySchema = z.enum([
  'correctness',
  'security',
  'concurrency',
  'memory_management',
  'compatibility',
  'api_design',
  'hardening',
  'test_coverage',
  'performance',
])

/**
 * Validated finding category exchanged through the shared protocol.
 */
export type RepositoryReviewCategory = z.infer<typeof RepositoryReviewCategorySchema>

/**
 * Validates reviewer confidence in a finding.
 */
export const RepositoryReviewConfidenceSchema = z.enum(['high', 'medium', 'low'])

/**
 * Validated finding confidence exchanged through the shared protocol.
 */
export type RepositoryReviewConfidence = z.infer<typeof RepositoryReviewConfidenceSchema>

/**
 * Validates the merge-oriented decision for a completed review.
 *
 * - `approve` — no blocking findings
 * - `comment` — non-blocking feedback only
 * - `request_changes` — one or more required-before-merge findings
 * - `incomplete` — review could not be completed with available evidence
 */
export const RepositoryReviewDecisionSchema = z.enum([
  'approve',
  'comment',
  'request_changes',
  'incomplete',
])

/**
 * Validated review decision exchanged through the shared protocol.
 */
export type RepositoryReviewDecision = z.infer<typeof RepositoryReviewDecisionSchema>

/**
 * Validates an optional file location for a finding.
 */
export const RepositoryReviewFindingLocationSchema = z
  .object({
    /**
     * Primary line of the affected code, 1-based.
     */
    line: z.number().int().positive(),

    /**
     * Repository-relative path of the affected file.
     */
    path: z.string().trim().min(1),
  })
  .strict()

/**
 * Validated finding location exchanged through the shared protocol.
 */
export type RepositoryReviewFindingLocation = z.infer<typeof RepositoryReviewFindingLocationSchema>

/**
 * Validates one issue reported by the review engine.
 */
export const RepositoryReviewFindingSchema = z
  .object({
    /**
     * Technical category of the finding.
     */
    category: RepositoryReviewCategorySchema,

    /**
     * Confidence that the finding is real and correctly classified.
     */
    confidence: RepositoryReviewConfidenceSchema,

    /**
     * Merge treatment for the finding.
     */
    disposition: RepositoryReviewDispositionSchema,

    /**
     * Concrete evidence the reviewer used (paths, symbols, behaviors).
     */
    evidence: z.array(z.string().trim().min(1)),

    /**
     * Stable finding identifier within the review result.
     */
    id: z.string().trim().min(1),

    /**
     * User, caller, system, or maintenance impact.
     */
    impact: z.string().trim().min(1),

    /**
     * Optional file location anchoring the finding.
     */
    location: RepositoryReviewFindingLocationSchema.optional(),

    /**
     * Description of the concrete problem.
     */
    problem: z.string().trim().min(1),

    /**
     * Direction for resolving the issue.
     */
    recommendation: z.string().trim().min(1),

    /**
     * Severity assigned to the finding.
     */
    severity: RepositoryReviewSeveritySchema,

    /**
     * Short human-readable summary of the finding.
     */
    title: z.string().trim().min(1),

    /**
     * Checks that would confirm the fix.
     */
    verification: z.array(z.string().trim().min(1)),
  })
  .strict()

/**
 * Validated review finding exchanged through the shared protocol.
 */
export type RepositoryReviewFinding = z.infer<typeof RepositoryReviewFindingSchema>

/**
 * Validates validation activity recorded for a completed review.
 */
export const RepositoryReviewValidationSchema = z
  .object({
    /**
     * Validation steps that were not performed (with brief reason when useful).
     */
    notPerformed: z.array(z.string().trim().min(1)),

    /**
     * Validation steps actually performed during the review.
     */
    performed: z.array(z.string().trim().min(1)),
  })
  .strict()

/**
 * Validated review validation section exchanged through the shared protocol.
 */
export type RepositoryReviewValidation = z.infer<typeof RepositoryReviewValidationSchema>

/**
 * Validates the handler result for a completed `repository.review` job.
 *
 * Produced by a Node after running the review engine against the prepared
 * repository and publishing the outcome through the source-control provider.
 * Callers persist or return this object as the job outcome; it is not the
 * claim/complete transport envelope itself. The schema is strict so unknown
 * properties fail closed and surface protocol drift.
 */
export const RepositoryReviewJobResultSchema = z
  .object({
    /**
     * Host-loaded or repository instruction files applied during the review.
     */
    appliedPolicies: z.array(z.string().trim().min(1)),

    /**
     * Language, framework, or review skills applied during the review.
     */
    appliedSkills: z.array(z.string().trim().min(1)),

    /**
     * Merge-oriented decision for the reviewed change.
     */
    decision: RepositoryReviewDecisionSchema,

    /**
     * Individual issues reported by the engine; may be empty.
     */
    findings: z.array(RepositoryReviewFindingSchema),

    /**
     * Missing context, unresolved revisions, or other review limitations.
     */
    limitations: z.array(z.string().trim().min(1)),

    /**
     * Positive observations worth preserving in the published review.
     */
    strengths: z.array(z.string().trim().min(1)),

    /**
     * Overall assessment of the reviewed change.
     */
    summary: z.string().trim().min(1),

    /**
     * Validation performed and skipped during the review.
     */
    validation: RepositoryReviewValidationSchema,
  })
  .strict()

/**
 * Validated `repository.review` job result exchanged through the shared protocol.
 */
export type RepositoryReviewJobResult = z.infer<typeof RepositoryReviewJobResultSchema>
