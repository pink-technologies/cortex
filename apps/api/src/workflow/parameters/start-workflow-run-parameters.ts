// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ExecutionJobSource } from '../../execution/models/execution-job-source'

/**
 * Inputs for {@link WorkflowOrchestrator.start}.
 *
 * Creates a {@link WorkflowRun} from a registered definition and activates the
 * first `JOB` step by enqueueing a child {@link ExecutionJob}.
 */
export interface StartWorkflowRunParameters {
  /**
   * Uniqueness key so at most one run holds this value at a time.
   *
   * Stored on the run (not the child job). When omitted, no active-key
   * constraint is applied.
   */
  readonly activeKey?: string

  /**
   * Registry key of the workflow definition to start
   * (for example `jira.triage.flow`).
   */
  readonly definitionKey: string

  /**
   * Opaque input stored on the run and used as the first job payload.
   */
  readonly input: unknown

  /**
   * Queue priority for the first child job. Defaults to `0` when omitted.
   */
  readonly priority?: number

  /**
   * External origin recorded on the first child job (for example a webhook
   * delivery). Later steps' jobs carry no source; they originate from the
   * workflow itself.
   */
  readonly source?: ExecutionJobSource

  /**
   * Idempotency key for start.
   *
   * Stored on the run. Re-submitting the same value must not create a second
   * run. When omitted, each call creates a new run.
   */
  readonly triggerIdentifier?: string
}
