// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ExecutionJob } from '../../execution/models/execution-job'
import type { WorkflowRun } from './workflow-run'

/**
 * Outcome of {@link WorkflowOrchestrator.start}.
 *
 * Includes the activated run (with refreshed statuses) and the child job for
 * the first `JOB` step.
 */
export interface StartWorkflowRunResult {
  /**
   * Child execution job created for the first `JOB` step.
   *
   * Status is `QUEUED` and claimable by the existing node claim path.
   */
  readonly job: ExecutionJob

  /**
   * Persisted run after activation (`RUNNING`, first step `QUEUED`).
   */
  readonly run: WorkflowRun
}
