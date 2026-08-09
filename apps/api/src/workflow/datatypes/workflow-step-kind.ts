// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Step execution kinds for a {@link WorkflowStep}.
 *
 * Mirrors the Prisma `WorkflowStepKind` enum.
 *
 * @property JOB - Enqueues an {@link ExecutionJob} claimed by a Node.
 * @property APPROVAL - Human gate; no claimable job.
 */
export const WorkflowStepKind = {
  APPROVAL: 'APPROVAL',
  JOB: 'JOB',
} as const

/**
 * Union of string literals in {@link WorkflowStepKind}.
 */
export type WorkflowStepKind = (typeof WorkflowStepKind)[keyof typeof WorkflowStepKind]
