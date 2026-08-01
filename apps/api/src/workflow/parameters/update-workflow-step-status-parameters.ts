// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowStepStatus } from '../datatypes'

/**
 * Inputs for updating a {@link WorkflowStep} status and related fields.
 *
 * {@link status} is always applied. Optional fields are written only when
 * provided; omit them to leave the current value unchanged. Pass `null` to
 * clear a nullable timestamp or JSON field.
 */
export interface UpdateWorkflowStepStatusParameters {
  /**
   * Completion timestamp for a successful terminal transition.
   *
   * Typically set with {@link status} `COMPLETED`. Omit to leave unchanged;
   * `null` clears a previously stored value.
   */
  readonly completedAt?: Date | null

  /**
   * Failure timestamp for a failed terminal transition.
   *
   * Typically set with {@link status} `FAILED`. Omit to leave unchanged;
   * `null` clears a previously stored value.
   */
  readonly failedAt?: Date | null

  /**
   * Output produced when the step finishes successfully.
   *
   * Omit to leave unchanged; `null` clears a previously stored payload.
   */
  readonly output?: unknown | null

  /**
   * Timestamp when the step first became active (left `PENDING`).
   *
   * Typically set with {@link status} `QUEUED`, `RUNNING`, or
   * `AWAITING_APPROVAL`. Omit to leave unchanged; `null` clears a previously
   * stored value.
   */
  readonly startedAt?: Date | null

  /**
   * Target lifecycle status for the step.
   */
  readonly status: WorkflowStepStatus
}
