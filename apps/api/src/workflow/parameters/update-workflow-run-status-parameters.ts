// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowRunStatus } from '../datatypes'

/**
 * Inputs for updating a {@link WorkflowRun} status and related fields.
 *
 * {@link status} is always applied. Optional fields are written only when
 * provided; omit them to leave the current value unchanged. Pass `null` to
 * clear a nullable timestamp or JSON field.
 */
export interface UpdateWorkflowRunStatusParameters {
  /**
   * Uniqueness key controlling "at most one active run" semantics.
   *
   * Pass `null` on terminal transitions to release the key so a later run may
   * reuse it. Omit to leave the stored value unchanged.
   */
  readonly activeKey?: string | null

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
   * Failure details stored on the run when it fails.
   *
   * Omit to leave unchanged; `null` clears a previously stored payload.
   */
  readonly failure?: unknown | null

  /**
   * Result stored on the run when it completes successfully.
   *
   * Omit to leave unchanged; `null` clears a previously stored payload.
   */
  readonly result?: unknown | null

  /**
   * Timestamp when the run first became active (left `PENDING`).
   *
   * Typically set with {@link status} `RUNNING`. Omit to leave unchanged;
   * `null` clears a previously stored value.
   */
  readonly startedAt?: Date | null

  /**
   * Target lifecycle status for the run.
   */
  readonly status: WorkflowRunStatus
}
