// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import { WorkflowAdvancer, WorkflowApprovalHandler, WorkflowCanceller, WorkflowStarter } from './operations'
import type { StartWorkflowRunResult } from '../models/start-workflow-run-result'
import type { WorkflowRun } from '../models/workflow-run'
import type { StartWorkflowRunParameters } from '../parameters/start-workflow-run-parameters'

/**
 * Public entry point for starting and advancing workflow runs.
 *
 * A thin facade over the flow collaborators so consumers depend on one
 * surface:
 * - {@link WorkflowStarter} creates a run and activates its first `JOB` step.
 * - {@link WorkflowAdvancer} advances or fails a run after a child execution
 *   job reaches a terminal state.
 * - {@link WorkflowApprovalHandler} applies human decisions to runs parked in
 *   `AWAITING_APPROVAL`.
 * - {@link WorkflowCanceller} cancels in-flight runs on operator request.
 *
 * Every flow applies its mutations inside a single database transaction so
 * run/step status and child job enqueue commit atomically. On job terminal,
 * complete/fail is persisted first by `ExecutionJobService`; the advance/fail
 * transaction covers the workflow half only.
 */
@Injectable()
export class WorkflowOrchestrator {
  // MARK: - Constructor

  /**
   * Creates a workflow orchestrator.
   *
   * @param advancer - Flow advancing or failing runs on job terminal states.
   * @param approvalHandler - Flow applying human approval decisions.
   * @param canceller - Flow cancelling in-flight runs.
   * @param starter - Flow creating and activating new runs.
   */
  constructor(
    private readonly advancer: WorkflowAdvancer,
    private readonly approvalHandler: WorkflowApprovalHandler,
    private readonly canceller: WorkflowCanceller,
    private readonly starter: WorkflowStarter,
  ) {}

  // MARK: - Instance methods

  /**
   * Applies a positive approval decision to a parked run.
   *
   * Completes the step awaiting approval, then activates the next `JOB` step
   * (returning the run to `RUNNING`), parks again when the next step is
   * another `APPROVAL`, or completes the run when no steps remain. Concurrent
   * decisions are resolved by an optimistic status guard so only one applies.
   *
   * @param runId - Primary key of the run awaiting approval.
   * @returns The refreshed run after the decision; `null` when the run does not exist.
   * @throws {@link WorkflowApprovalError} When no step is awaiting approval.
   */
  async approve(runId: string): Promise<WorkflowRun | null> {
    return this.approvalHandler.approve(runId)
  }

  /**
   * Cancels an in-flight workflow run.
   *
   * Moves the run and its non-terminal steps to `CANCELLED` in one
   * transaction, cancels the run's `QUEUED` child jobs, and flags `RUNNING`
   * child jobs with a cancellation request. Concurrent terminal transitions
   * win the race; the cancellation then fails instead of overwriting them.
   *
   * @param runId - Primary key of the run to cancel.
   * @returns The refreshed run after cancellation; `null` when the run does not exist.
   * @throws {@link WorkflowCancelError} When the run is already terminal.
   */
  async cancel(runId: string): Promise<WorkflowRun | null> {
    return this.canceller.cancel(runId)
  }

  /**
   * Advances the workflow after a child execution job completes successfully.
   *
   * No-ops when the job is not linked to a run/step, or when the step is
   * already terminal (idempotent retries of complete). Completes the current
   * step, then activates the next `JOB` step, completes the run when no steps
   * remain, or parks the run in `AWAITING_APPROVAL` when the next step is
   * `APPROVAL`.
   *
   * @param jobId - Primary key of the completed execution job.
   */
  async onJobCompleted(jobId: string): Promise<void> {
    return this.advancer.onJobCompleted(jobId)
  }

  /**
   * Fails the workflow after a child execution job fails terminally.
   *
   * No-ops when the job is not linked to a run/step, or when the step is
   * already terminal. Marks the step and run `FAILED` in one transaction.
   *
   * @param jobId - Primary key of the failed execution job.
   */
  async onJobFailed(jobId: string): Promise<void> {
    return this.advancer.onJobFailed(jobId)
  }

  /**
   * Applies a negative approval decision to a parked run.
   *
   * Fails the step awaiting approval and the run in one transaction. The
   * run's failure payload records the rejected step.
   *
   * @param runId - Primary key of the run awaiting approval.
   * @returns The refreshed run after the decision; `null` when the run does not exist.
   * @throws {@link WorkflowApprovalError} When no step is awaiting approval.
   */
  async reject(runId: string): Promise<WorkflowRun | null> {
    return this.approvalHandler.reject(runId)
  }

  /**
   * Starts a workflow run for the given definition key.
   *
   * Creates the run and all definition steps in `PENDING`, then activates the
   * first step when it is a `JOB`: enqueues a child execution job whose
   * payload is the run input, marks the step `QUEUED`, and marks the run
   * `RUNNING`. Those writes run in a single transaction.
   *
   * @param parameters - Definition key, input, and optional run idempotency keys.
   * @returns The activated run and the first-step child job.
   * @throws {@link WorkflowDefinitionNotFoundError} When the definition key is unknown.
   * @throws {@link WorkflowStartError} When the first step is not an activatable `JOB`.
   * @throws {@link WorkflowRunCreateError} When run persistence fails (including unique collisions).
   */
  async start(parameters: StartWorkflowRunParameters): Promise<StartWorkflowRunResult> {
    return this.starter.start(parameters)
  }
}
