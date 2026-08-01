// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Wire-level lifecycle states exposed for a workflow run.
 *
 * Keep these values aligned with the workflow-run status values used by
 * persistence and domain layers.
 *
 * - `PENDING` — persisted but not yet started.
 * - `RUNNING` — at least one step is active or queued.
 * - `AWAITING_APPROVAL` — paused on a human approval step.
 * - `COMPLETED` — all steps finished successfully.
 * - `FAILED` — a step failed or approval was rejected.
 * - `CANCELLED` — cancelled before completion.
 */
export const WorkflowRunStatusSchema = z.enum([
  'AWAITING_APPROVAL',
  'CANCELLED',
  'COMPLETED',
  'FAILED',
  'PENDING',
  'RUNNING',
])

/**
 * Validated workflow-run status exchanged through the shared protocol.
 *
 * Derived from {@link WorkflowRunStatusSchema} so runtime validation and the
 * TypeScript union cannot drift independently.
 */
export type WorkflowRunStatus = z.infer<typeof WorkflowRunStatusSchema>
