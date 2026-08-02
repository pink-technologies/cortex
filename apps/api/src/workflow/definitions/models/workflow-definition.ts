// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowStepKind } from '../../datatypes'

/**
 * Data available to a step's payload builder when the step is activated.
 *
 * Snapshot of the run at activation time: the original start input plus the
 * outputs of every step completed so far.
 */
export interface WorkflowStepPayloadContext {
  /**
   * Opaque run input supplied at start.
   */
  readonly input: unknown

  /**
   * Most recent non-null step output produced before this activation, or
   * `undefined` when no completed step has produced output yet.
   */
  readonly latestOutput: unknown

  /**
   * Non-null outputs of completed steps, keyed by step key
   * (for example `triage`).
   */
  readonly outputs: Readonly<Record<string, unknown>>
}

/**
 * One step in a {@link WorkflowDefinition}.
 *
 * Describes how a run step is created; it is not a persisted
 * {@link WorkflowStep} row.
 */
export interface WorkflowDefinitionStep {
  /**
   * Builds the child job payload when this `JOB` step is activated.
   *
   * Receives the run input and prior step outputs; returns the payload the
   * enqueued execution job carries. When omitted, the step receives the most
   * recent step output, falling back to the run input. Only valid on `JOB`
   * steps.
   *
   * Throwing (for example a failed schema parse) aborts the enclosing start
   * or advance transaction; the orchestrator surfaces it as a
   * {@link WorkflowStartError} or {@link WorkflowAdvanceError}.
   */
  readonly buildPayload?: (context: WorkflowStepPayloadContext) => unknown

  /**
   * Handler kind when {@link kind} is `JOB` (for example `jira.triage`).
   *
   * Required for `JOB` steps; omit for `APPROVAL`.
   */
  readonly jobKind?: string

  /**
   * Stable step identity within the definition (for example `triage`).
   */
  readonly key: string

  /**
   * Whether this step enqueues a job or waits for human approval.
   */
  readonly kind: WorkflowStepKind

  /**
   * Zero-based order of this step within the definition.
   */
  readonly position: number
}

/**
 * Code-defined workflow shape used to start runs.
 *
 * Resolved by {@link WorkflowDefinitionRegistry} via {@link key}.
 * {@link WorkflowOrchestrator.start} turns these steps into persisted
 * {@link WorkflowRun} / {@link WorkflowStep} rows.
 */
export interface WorkflowDefinition {
  /**
   * Stable registry key (for example `jira.triage.flow`).
   */
  readonly key: string

  /**
   * Steps that make up the flow.
   *
   * Must be non-empty. {@link WorkflowDefinitionStep.key} and
   * {@link WorkflowDefinitionStep.position} must be unique within the list.
   * {@link WorkflowDefinitionRegistry.register} stores them ordered by
   * `position` ascending.
   */
  readonly steps: readonly WorkflowDefinitionStep[]
}
