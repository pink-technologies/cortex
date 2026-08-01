// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { RepositoryReviewModeSchema } from './repository-review-job-payload'

/**
 * Validates the severity assigned to a single review finding.
 *
 * - `info` — observation or suggestion with no required action
 * - `warning` — likely problem the author should evaluate
 * - `error` — defect the author is expected to fix
 */
export const RepositoryReviewSeveritySchema = z.enum(['info', 'warning', 'error'])

/**
 * Validated finding severity exchanged through the shared protocol.
 *
 * Derived from {@link RepositoryReviewSeveritySchema} so runtime validation
 * and the TypeScript representation remain synchronized.
 */
export type RepositoryReviewSeverity = z.infer<typeof RepositoryReviewSeveritySchema>

/**
 * Validates one issue reported by the review engine.
 *
 * Findings are file-anchored when the engine can attribute the issue to a
 * location; repository-wide observations omit `path` and line information.
 */
export const RepositoryReviewFindingSchema = z
  .object({
    /**
     * Explanation of the issue and, when possible, how to address it.
     */
    detail: z.string().trim().min(1),

    /**
     * Last line of the affected range, inclusive.
     *
     * Requires {@link startLine}; omit for whole-file or repository-wide
     * findings.
     */
    endLine: z.number().int().positive().optional(),

    /**
     * Repository-relative path of the affected file.
     *
     * Omit for repository-wide findings.
     */
    path: z.string().trim().min(1).optional(),

    /**
     * Severity assigned to the finding.
     */
    severity: RepositoryReviewSeveritySchema,

    /**
     * First line of the affected range.
     *
     * Omit for whole-file or repository-wide findings.
     */
    startLine: z.number().int().positive().optional(),

    /**
     * Short human-readable summary of the finding.
     */
    title: z.string().trim().min(1),
  })
  .strict()

/**
 * Validated review finding exchanged through the shared protocol.
 *
 * Derived from {@link RepositoryReviewFindingSchema} so runtime validation and
 * the TypeScript representation remain synchronized.
 */
export type RepositoryReviewFinding = z.infer<typeof RepositoryReviewFindingSchema>

/**
 * Validates the handler result for a completed `repository.review` job.
 *
 * Produced by a Node after running the review engine against the prepared
 * repository and publishing the outcome through the source-control provider.
 * Callers persist or return this object as the job outcome; it is not the
 * claim/complete transport envelope itself. The schema is strict so unknown
 * properties fail closed and surface protocol drift.
 *
 * Field semantics:
 * - `findings` — individual issues reported by the engine; may be empty
 * - `reviewMode` — strategy that produced the result (`diff` or `full`)
 * - `summary` — overall assessment of the reviewed change
 */
export const RepositoryReviewJobResultSchema = z
  .object({
    /**
     * Individual issues reported by the review engine.
     *
     * An empty array is a valid outcome for a clean review.
     */
    findings: z.array(RepositoryReviewFindingSchema),

    /**
     * Review strategy that produced this result.
     */
    reviewMode: RepositoryReviewModeSchema,

    /**
     * Overall assessment of the reviewed change.
     */
    summary: z.string().trim().min(1),
  })
  .strict()

/**
 * Validated `repository.review` job result exchanged through the shared protocol.
 *
 * Derived from {@link RepositoryReviewJobResultSchema} so runtime validation
 * and the TypeScript representation remain synchronized.
 */
export type RepositoryReviewJobResult = z.infer<typeof RepositoryReviewJobResultSchema>
