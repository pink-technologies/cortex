// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Persisted outcome of a human approval decision command.
 *
 * @property APPROVED - The named approval step was accepted.
 * @property REJECTED - The named approval step was rejected.
 */
export const WorkflowApprovalDecisionOutcome = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

/**
 * Union of string literals in {@link WorkflowApprovalDecisionOutcome}.
 */
export type WorkflowApprovalDecisionOutcome =
  (typeof WorkflowApprovalDecisionOutcome)[keyof typeof WorkflowApprovalDecisionOutcome]
