// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowStepKind } from '../../datatypes'

/**
 * Inputs for one step created with {@link CreateWorkflowRunParameters}.
 *
 * Steps are persisted in `PENDING` with the run. {@link key} and {@link position}
 * must be unique within that run.
 */
export interface CreateWorkflowStepParameters {
  /**
   * Optional input stored on the step for later activation.
   *
   * When omitted, the step is created with no step-scoped input.
   */
  readonly input?: unknown

  /**
   * Handler kind for a `JOB` step (for example `jira.triage`).
   *
   * Required when {@link kind} is `JOB`; omit for `APPROVAL` steps.
   */
  readonly jobKind?: string

  /**
   * Stable step identity within the run (for example `triage`, `approval`).
   *
   * Used by callers to address the step after create; must be unique per run.
   */
  readonly key: string

  /**
   * How the step runs: enqueue an execution job (`JOB`) or wait for a human
   * decision (`APPROVAL`).
   */
  readonly kind: WorkflowStepKind

  /**
   * Zero-based order of this step within the run.
   *
   * Lower positions activate first in a linear flow; must be unique per run.
   */
  readonly position: number
}

/**
 * Inputs for creating a {@link WorkflowRun} and its steps atomically.
 *
 * The run starts in `PENDING` with the given {@link input}. Duplicate
 * {@link activeKey} or {@link triggerIdentifier} values resolve to the
 * existing run via {@link WorkflowRunRepository.getOrCreate}.
 */
export interface CreateWorkflowRunParameters {
  /**
   * Uniqueness key so at most one run holds this value at a time.
   *
   * Useful for “already in progress for this issue” semantics. When omitted,
   * no active-key constraint is applied.
   */
  readonly activeKey?: string

  /**
   * Registry key of the workflow definition that describes this run
   * (for example `jira.triage.flow`).
   */
  readonly definitionKey: string

  /**
   * Immutable definition revision pinned onto the run at create time.
   */
  readonly definitionVersion: number

  /**
   * Opaque input supplied at start and stored on the run.
   *
   * Later steps may project from this value when activated.
   */
  readonly input: unknown

  /**
   * Steps created with the run, typically in activation order.
   *
   * Pass at least one step for a usable flow. Each entry’s {@link CreateWorkflowStepParameters#key}
   * and {@link CreateWorkflowStepParameters#position} must be unique within the list.
   */
  readonly steps: readonly CreateWorkflowStepParameters[]

  /**
   * Idempotency key for start.
   *
   * Re-submitting the same value must not create a second run; create fails on
   * collision. When omitted, each call creates a new run.
   */
  readonly triggerIdentifier?: string
}
