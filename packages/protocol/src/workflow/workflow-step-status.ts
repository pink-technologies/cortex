// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Wire-level lifecycle states exposed for a workflow step.
 *
 * Keep these values aligned with the workflow-step status values used by
 * persistence and domain layers.
 *
 * - `PENDING` — created; not yet activated.
 * - `QUEUED` — JOB step whose execution job is waiting to be claimed.
 * - `RUNNING` — JOB step with an in-flight attempt.
 * - `AWAITING_APPROVAL` — APPROVAL step waiting for a human decision.
 * - `COMPLETED` — finished successfully.
 * - `FAILED` — failed or rejected.
 * - `SKIPPED` — intentionally not executed.
 * - `CANCELLED` — cancelled with the run.
 */
export const WorkflowStepStatusSchema = z.enum([
  'AWAITING_APPROVAL',
  'CANCELLED',
  'COMPLETED',
  'FAILED',
  'PENDING',
  'QUEUED',
  'RUNNING',
  'SKIPPED',
])

/**
 * Validated workflow-step status exchanged through the shared protocol.
 *
 * Derived from {@link WorkflowStepStatusSchema} so runtime validation and the
 * TypeScript union cannot drift independently.
 */
export type WorkflowStepStatus = z.infer<typeof WorkflowStepStatusSchema>
