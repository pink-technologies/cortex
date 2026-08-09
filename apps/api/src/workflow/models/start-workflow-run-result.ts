// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ExecutionJob } from '../../execution/models/execution-job'
import type { WorkflowRun } from './workflow-run'

/**
 * Outcome of {@link WorkflowOrchestrator.start}.
 *
 * Includes the activated run (with refreshed statuses) and the child job for
 * the first `JOB` step. When the same idempotency key already owned a run,
 * {@link created} is `false` and both values refer to that existing work.
 */
export interface StartWorkflowRunResult {
  /**
   * Whether this call created a new run and activated its first job.
   *
   * `false` when an existing run was returned for the same `triggerIdentifier`
   * or `activeKey`.
   */
  readonly created: boolean

  /**
   * Child execution job for the first `JOB` step.
   *
   * Status is `QUEUED` (or later) and claimable by the existing node claim path
   * when still queued.
   */
  readonly job: ExecutionJob

  /**
   * Persisted run after activation (`RUNNING`, first step `QUEUED`) or the
   * pre-existing run when {@link created} is `false`.
   */
  readonly run: WorkflowRun
}
