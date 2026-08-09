// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Known origin categories for {@link ExecutionJobSource.type}.
 *
 * Values are stored on `ExecutionJob.sourceType`. Prefer these constants at
 * call sites so origin strings stay consistent for indexes and queries.
 */
export const ExecutionJobSourceType = {
  CHAT: 'chat',
  CRON: 'cron',
  WEBHOOK: 'webhook',
} as const

/** Origin category for an execution job source. */
export type ExecutionJobSourceType =
  (typeof ExecutionJobSourceType)[keyof typeof ExecutionJobSourceType]

/**
 * External origin of a job, mapped to `ExecutionJob.sourceType` / `sourceIdentifier`.
 *
 * Used for tracing, idempotency grouping, and indexes on `(sourceType, sourceIdentifier)`.
 */
export interface ExecutionJobSource {
  /**
   * Stable id within {@link type} (for example a chat message id, webhook delivery id).
   */
  readonly identifier: string

  /**
   * Origin category for this job.
   */
  readonly type: ExecutionJobSourceType
}
