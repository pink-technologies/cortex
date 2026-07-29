// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Wire-level lifecycle states accepted for an execution job.
 *
 * This protocol schema is the shared validation boundary between API and
 * worker processes. Keep its values aligned with the execution-job status
 * values used by persistence and domain layers.
 *
 * - `QUEUED` — accepted and waiting for an eligible worker.
 * - `RUNNING` — currently being processed by a worker.
 * - `AWAITING_REVIEW` — paused pending human or external approval.
 * - `COMPLETED` — finished successfully.
 * - `FAILED` — terminated unsuccessfully with no further automatic attempt.
 * - `CANCELLED` — stopped by an explicit cancellation request.
 * - `INTERRUPTED` — stopped unexpectedly and may be eligible for recovery.
 */
export const ExecutionJobStatusSchema = z.enum([
  'AWAITING_REVIEW',
  'CANCELLED',
  'COMPLETED',
  'FAILED',
  'INTERRUPTED',
  'QUEUED',
  'RUNNING',
])

/**
 * Validated execution-job status exchanged through the shared protocol.
 *
 * Derived from {@link ExecutionJobStatusSchema} so runtime validation and the
 * TypeScript union cannot drift independently.
 */
export type ExecutionJobStatus = z.infer<typeof ExecutionJobStatusSchema>