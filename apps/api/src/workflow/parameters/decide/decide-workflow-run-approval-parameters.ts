// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Command to approve or reject a parked workflow approval step.
 *
 * {@link stepId} must be the run's current `AWAITING_APPROVAL` step.
 * {@link decisionId} makes retries idempotent and seeds the approval audit
 * trail; a decision aimed at an obsolete step fails with conflict.
 */
export interface DecideWorkflowRunApprovalParameters {
  /**
   * Operator or system actor that issued the decision.
   */
  readonly actorId: string

  /**
   * Client-supplied idempotency key for this decision command.
   */
  readonly decisionId: string

  /**
   * Optional operator reason recorded on the audit row.
   */
  readonly reason?: string

  /**
   * Primary key of the workflow run that owns the approval step.
   */
  readonly runId: string

  /**
   * Primary key of the `APPROVAL` step being decided.
   */
  readonly stepId: string
}
