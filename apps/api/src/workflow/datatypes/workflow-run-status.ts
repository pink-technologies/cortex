// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Lifecycle states for a {@link WorkflowRun}.
 *
 * Mirrors the Prisma `WorkflowRunStatus` enum. Prefer these literals in
 * application code so string values stay aligned with the database.
 *
 * @property PENDING - Persisted but not yet started.
 * @property RUNNING - At least one step is active or queued.
 * @property AWAITING_APPROVAL - Paused on a human approval step.
 * @property COMPLETED - All steps finished successfully (terminal).
 * @property FAILED - A step failed or approval was rejected (terminal).
 * @property CANCELLED - Cancelled before completion (terminal).
 */
export const WorkflowRunStatus = {
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
} as const

/**
 * Union of string literals in {@link WorkflowRunStatus}.
 */
export type WorkflowRunStatus = (typeof WorkflowRunStatus)[keyof typeof WorkflowRunStatus]
