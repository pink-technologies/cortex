// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Lifecycle states for an orchestration {@link ExecutionJob}.
 *
 * Mirrors the Prisma `ExecutionJobStatus` enum. Use these literals when writing
 * status in application code so string values stay aligned with the database.
 *
 * @property QUEUED - Accepted and waiting to be claimed by a worker.
 * @property RUNNING - An attempt is actively executing.
 * @property AWAITING_REVIEW - Paused pending human or external approval.
 * @property COMPLETED - Finished successfully (terminal).
 * @property FAILED - Exhausted attempts or failed without recovery (terminal).
 * @property CANCELLED - Cancelled by request before or during execution (terminal).
 * @property INTERRUPTED - Stopped unexpectedly (for example worker crash or deadline); may be retried.
 */
export const ExecutionJobStatus = {
    AWAITING_REVIEW: 'AWAITING_REVIEW',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    INTERRUPTED: 'INTERRUPTED',
    QUEUED: 'QUEUED',
    RUNNING: 'RUNNING',
} as const

/**
 * Union of string literals in {@link ExecutionJobStatus}.
 *
 * Prefer this over a bare `string` when reading or updating `ExecutionJob.status`.
 * Not the same as the legacy chat-pipeline Prisma `JobStatus` enum.
 */
export type ExecutionJobStatus = (typeof ExecutionJobStatus)[keyof typeof ExecutionJobStatus]
