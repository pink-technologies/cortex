// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Stable machine-readable codes stored on a failed {@link WorkflowRun}'s
 * `failure` payload.
 *
 * Prefer these literals at write sites so clients can branch on rejection
 * reasons without depending on free-form strings.
 *
 * @property APPROVAL_REJECTED - An `APPROVAL` step was rejected by an operator.
 * @property JOB_FAILED - A linked child execution job failed terminally.
 */
export const WorkflowRunFailureCode = {
  APPROVAL_REJECTED: 'WORKFLOW_APPROVAL_REJECTED',
  JOB_FAILED: 'WORKFLOW_JOB_FAILED',
} as const

/**
 * Union of string literals in {@link WorkflowRunFailureCode}.
 */
export type WorkflowRunFailureCode = (typeof WorkflowRunFailureCode)[keyof typeof WorkflowRunFailureCode]
