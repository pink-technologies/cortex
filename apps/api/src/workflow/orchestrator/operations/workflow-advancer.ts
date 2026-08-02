// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { Database } from '@/infraestructure/database'
import { ExecutionJobService } from '../../../execution/execution-job.service'
import type { ExecutionJob } from '../../../execution/models/execution-job'
import { WorkflowStepStatus } from '../../datatypes'
import { WorkflowTransitioner } from '../transitions'
import type { WorkflowRun } from '../../models/workflow-run'
import type { WorkflowStep } from '../../models/workflow-step'
import { WORKFLOW_RUN_REPOSITORY, type WorkflowRunRepository } from '../../repository'

/**
 * Resolved workflow context for a terminal child job.
 *
 * Produced by the advancer's linked-step lookup when the job belongs to a run
 * and its step is still active.
 */
interface LinkedStepContext {
  /**
   * Terminal child execution job that triggered advance or fail.
   */
  readonly job: ExecutionJob

  /**
   * Run that owns {@link LinkedStepContext#step}.
   */
  readonly run: WorkflowRun

  /**
   * Non-terminal step linked to {@link LinkedStepContext#job}.
   */
  readonly step: WorkflowStep
}

/**
 * Advances or fails workflow runs after a child execution job terminates.
 *
 * Owns the job-driven flow only: resolving the run and step linked to a
 * terminal job, then delegating the actual transition to
 * {@link WorkflowTransitioner} inside one transaction. Approval decisions
 * live in their own collaborator behind {@link WorkflowOrchestrator}.
 */
@Injectable()
export class WorkflowAdvancer {
  // MARK: - Constructor

  /**
   * Creates a workflow advancer.
   *
   * @param database - Database client used for advance/fail transactions.
   * @param executionJobService - Service used to load terminal child jobs.
   * @param transitioner - Transition writer applying step and run updates.
   * @param workflowRunRepository - Persistence port for runs and steps.
   */
  constructor(
    private readonly database: Database,
    @Inject(forwardRef(() => ExecutionJobService))
    private readonly executionJobService: ExecutionJobService,
    private readonly transitioner: WorkflowTransitioner,
    @Inject(WORKFLOW_RUN_REPOSITORY)
    private readonly workflowRunRepository: WorkflowRunRepository,
  ) {}

  // MARK: - Instance methods

  /**
   * Advances the workflow after a child execution job completes successfully.
   *
   * No-ops when the job is not linked to a run/step, or when the step is already
   * terminal (idempotent retries of complete). Completes the current step, then
   * activates the next `JOB` step, completes the run when no steps remain, or
   * parks the run in `AWAITING_APPROVAL` when the next step is `APPROVAL`.
   *
   * Workflow writes run in a single transaction with an optimistic step-status
   * guard so concurrent completes do not double-advance.
   *
   * @param jobId - Primary key of the completed execution job.
   */
  async onJobCompleted(jobId: string): Promise<void> {
    const context = await this.resolveLinkedStep(jobId)

    if (!context) {
      return
    }

    const { job, run, step } = context

    await this.database.withTransaction(async (transaction) => {
      await this.transitioner.completeStepAndAdvance({
        guardStatuses: [WorkflowStepStatus.QUEUED, WorkflowStepStatus.RUNNING],
        output: job.result,
        payload: job.result ?? run.input,
        result: job.result,
        run,
        step,
        transaction,
      })
    })
  }

  /**
   * Fails the workflow after a child execution job fails terminally.
   *
   * No-ops when the job is not linked to a run/step, or when the step is already
   * terminal. Marks the step and run `FAILED` in one transaction.
   *
   * @param jobId - Primary key of the failed execution job.
   */
  async onJobFailed(jobId: string): Promise<void> {
    const context = await this.resolveLinkedStep(jobId)

    if (!context) {
      return
    }

    const { job, run, step } = context

    await this.database.withTransaction(async (transaction) => {
      await this.transitioner.failStepAndRun({
        failure: job.failure,
        guardStatuses: [WorkflowStepStatus.QUEUED, WorkflowStepStatus.RUNNING],
        run,
        step,
        transaction,
      })
    })
  }

  // MARK: - Private methods

  private async resolveLinkedStep(jobId: string): Promise<LinkedStepContext | null> {
    const job = await this.executionJobService.findById(jobId)

    if (job?.runId == null || job.stepId == null) {
      return null
    }

    const run = await this.workflowRunRepository.findById(job.runId)

    if (!run) {
      return null
    }

    const step = run.steps.find((candidate) => candidate.id === job.stepId)

    if (!step || step.isTerminal) {
      return null
    }

    return { job, run, step }
  }
}
