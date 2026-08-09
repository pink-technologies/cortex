// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowApprovalDecisionOutcome } from '../../datatypes'

/**
 * Inputs for persisting one approval decision audit record.
 */
export interface CreateWorkflowApprovalDecisionParameters {
  /**
   * Operator or system actor that issued the decision.
   */
  readonly actorId: string

  /**
   * Client-supplied idempotency key for this decision command.
   */
  readonly decisionId: string

  /**
   * Whether the named step was approved or rejected.
   */
  readonly outcome: WorkflowApprovalDecisionOutcome

  /**
   * Optional operator reason recorded with the decision.
   */
  readonly reason?: string

  /**
   * Owning workflow run primary key.
   */
  readonly runId: string

  /**
   * Approval step this decision targeted.
   */
  readonly stepId: string
}
