// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Port notified when an execution job linked to a workflow changes lifecycle.
 *
 * Owned by the execution module as an inbound dependency so workflow can bind
 * an implementation without creating an Execution → Workflow Nest module cycle.
 * Claim, complete, and fail notify through this boundary after the job row is
 * persisted.
 */
export interface WorkflowJobLifecycle {
  /**
   * Promotes the linked workflow step after a successful job claim.
   *
   * @param jobId - Primary key of the claimed execution job.
   */
  onJobClaimed(jobId: string): Promise<void>

  /**
   * Advances the owning workflow after a successful job completion.
   *
   * @param jobId - Primary key of the completed execution job.
   */
  onJobCompleted(jobId: string): Promise<void>

  /**
   * Fails the owning workflow after a terminal job failure.
   *
   * @param jobId - Primary key of the failed execution job.
   */
  onJobFailed(jobId: string): Promise<void>
}

/**
 * Injection token for {@link WorkflowJobLifecycle}.
 *
 * Bound by {@link WorkflowModule} to {@link WorkflowAdvancer}. Required by
 * {@link ExecutionJobService} so claim/complete/fail always have a workflow
 * callback boundary.
 */
export const WORKFLOW_JOB_LIFECYCLE = Symbol('WORKFLOW_JOB_LIFECYCLE')
