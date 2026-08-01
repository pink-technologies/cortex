// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowStepKind } from '../../datatypes'

/**
 * One step in a {@link WorkflowDefinition}.
 *
 * Describes how a run step is created; it is not a persisted
 * {@link WorkflowStep} row.
 */
export interface WorkflowDefinitionStep {
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
