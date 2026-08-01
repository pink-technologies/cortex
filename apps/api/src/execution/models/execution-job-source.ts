// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * External origin of a job, mapped to `ExecutionJob.sourceType` / `sourceIdentifier`.
 *
 * Used for tracing, idempotency grouping, and indexes on `(sourceType, sourceIdentifier)`.
 */
export interface ExecutionJobSource {
    /**
     * Stable id within {@link type} (for example a chat message id, webhook delivery id).
     */
    identifier: string

    /**
     * Origin category (for example `"chat"`, `"webhook"`, `"cron"`).
     */
    type: string
}
