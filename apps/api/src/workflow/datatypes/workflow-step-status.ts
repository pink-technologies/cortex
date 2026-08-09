// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Lifecycle states for a {@link WorkflowStep}.
 *
 * Mirrors the Prisma `WorkflowStepStatus` enum.
 *
 * @property PENDING - Created; not yet activated.
 * @property QUEUED - JOB step whose execution job is waiting to be claimed.
 * @property RUNNING - JOB step with an in-flight attempt.
 * @property AWAITING_APPROVAL - APPROVAL step waiting for a human decision.
 * @property COMPLETED - Finished successfully (terminal for the step).
 * @property FAILED - Failed or rejected (terminal for the step).
 * @property SKIPPED - Intentionally not executed (terminal for the step).
 * @property CANCELLED - Cancelled with the run (terminal for the step).
 */
export const WorkflowStepStatus = {
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  SKIPPED: 'SKIPPED',
} as const

/**
 * Union of string literals in {@link WorkflowStepStatus}.
 */
export type WorkflowStepStatus = (typeof WorkflowStepStatus)[keyof typeof WorkflowStepStatus]
