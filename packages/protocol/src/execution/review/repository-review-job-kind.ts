// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Discriminator value for execution jobs that review a source-control change.
 *
 * Set as {@link ExecutionJob.kind} when enqueueing or claiming a repository
 * review. Workers switch on this constant to validate
 * {@link ExecutionJob.payload} with {@link RepositoryReviewJobPayloadSchema}
 * and to interpret the job outcome as {@link RepositoryReviewJobResultSchema}.
 *
 * Prefer comparing against this export instead of hard-coding
 * `"repository.review"` so renames and refactors stay type-safe across API and
 * Node packages.
 */
export const RepositoryReviewJobKind = 'repository.review' as const

/**
 * Literal job-kind type for repository reviews (`"repository.review"`).
 *
 * Derived from {@link RepositoryReviewJobKind} so the compile-time union member
 * stays aligned with the runtime constant.
 */
export type RepositoryReviewJobKind = typeof RepositoryReviewJobKind
