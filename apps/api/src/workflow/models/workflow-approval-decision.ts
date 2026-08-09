// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowApprovalDecisionOutcome } from '../datatypes'
import type { WorkflowApprovalDecision as WorkflowApprovalDecisionPersistence } from '@/infraestructure/database'

/**
 * Domain model for one persisted approval decision command.
 *
 * Decouples consumers from Prisma row shapes. {@link decisionId} is the
 * client idempotency key; retries with the same id reuse this record.
 */
export class WorkflowApprovalDecision {
  /**
   * Stable primary key of the decision row.
   */
  readonly id: string

  /**
   * Operator or system actor that issued the decision.
   */
  readonly actorId: string

  /**
   * Timestamp when the decision was first persisted.
   */
  readonly createdAt: Date

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
  readonly reason: string | null

  /**
   * Owning workflow run primary key.
   */
  readonly runId: string

  /**
   * Approval step this decision targeted.
   */
  readonly stepId: string

  // MARK: - Constructor

  /**
   * Creates a workflow approval decision domain model.
   *
   * @param id - Stable primary key.
   * @param decisionId - Client idempotency key.
   * @param runId - Owning run.
   * @param stepId - Targeted approval step.
   * @param outcome - Approved or rejected.
   * @param actorId - Actor that issued the decision.
   * @param reason - Optional reason text.
   * @param createdAt - Persistence timestamp.
   */
  constructor(
    id: string,
    decisionId: string,
    runId: string,
    stepId: string,
    outcome: WorkflowApprovalDecisionOutcome,
    actorId: string,
    reason: string | null,
    createdAt: Date,
  ) {
    this.id = id
    this.decisionId = decisionId
    this.runId = runId
    this.stepId = stepId
    this.outcome = outcome
    this.actorId = actorId
    this.reason = reason
    this.createdAt = createdAt
  }

  // MARK: - Static methods

  /**
   * Maps a persistence row into the domain model.
   *
   * @param record - Prisma approval-decision row.
   * @returns Domain {@link WorkflowApprovalDecision}.
   */
  static from(record: WorkflowApprovalDecisionPersistence): WorkflowApprovalDecision {
    return new WorkflowApprovalDecision(
      record.id,
      record.decisionId,
      record.runId,
      record.stepId,
      record.outcome,
      record.actorId,
      record.reason,
      record.createdAt,
    )
  }
}
