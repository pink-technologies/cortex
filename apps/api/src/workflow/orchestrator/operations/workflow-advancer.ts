// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable, Logger } from '@nestjs/common'
import { Database } from '@/infraestructure/database'
import {
  EXECUTION_JOB_REPOSITORY,
  type ExecutionJobRepository,
} from '@/execution/execution-job-repository'
import { ExecutionJobStatus } from '@/execution/datatypes/execution-job-status'
import type { WorkflowJobLifecycle } from '@/execution/ports'
import { WorkflowStepStatus } from '../../datatypes'
import { sanitizeWorkflowRunFailure } from '../../sanitize'
import { WorkflowTransitioner } from '../transitions'
import { WORKFLOW_RUN_REPOSITORY, type WorkflowRunRepository } from '../../repository'

/**
 * Advances or fails workflow runs after a child execution job terminates, and
 * mirrors claim onto the linked step.
 *
 * Implements {@link WorkflowJobLifecycle} so execution can notify claim /
 * complete / fail through an explicit port without depending on
 * {@link WorkflowOrchestrator}.
 *
 * Owns the job-driven flow: loading the job, locking its run when advancing or
 * failing, revalidating status under that lock, then delegating to
 * {@link WorkflowTransitioner}. Claim only promotes the linked step
 * `QUEUED` → `RUNNING`. Approval decisions live in their own collaborator
 * behind {@link WorkflowOrchestrator}.
 */
@Injectable()
export class WorkflowAdvancer implements WorkflowJobLifecycle {
  // MARK: - Properties

  private readonly logger = new Logger(WorkflowAdvancer.name)

  // MARK: - Constructor

  /**
   * Creates a workflow advancer.
   *
   * @param database - Database client used for advance/fail transactions.
   * @param executionJobRepository - Persistence port used to load child jobs.
   * @param transitioner - Transition writer applying step and run updates.
   * @param workflowRunRepository - Persistence port for runs and steps.
   */
  constructor(
    private readonly database: Database,
    @Inject(EXECUTION_JOB_REPOSITORY)
    private readonly executionJobRepository: ExecutionJobRepository,
    private readonly transitioner: WorkflowTransitioner,
    @Inject(WORKFLOW_RUN_REPOSITORY)
    private readonly workflowRunRepository: WorkflowRunRepository,
  ) {}

  // MARK: - Instance methods

  /**
   * Marks the linked workflow step `RUNNING` after its child job is claimed.
   *
   * No-ops when the job is not linked to a run/step, when the reloaded job is
   * not `RUNNING`, or when the step has already left `QUEUED` (including an
   * idempotent second claim notification). Uses an optimistic status guard so
   * concurrent cancel/complete/fail transitions win without overwrite.
   *
   * @param jobId - Primary key of the claimed execution job.
   */
  async onJobClaimed(jobId: string): Promise<void> {
    const job = await this.executionJobRepository.findById(jobId)

    if (job?.runId == null || job.stepId == null) {
      return
    }

    if (job.status !== ExecutionJobStatus.RUNNING) {
      this.logger.error('onJobClaimed received a job that is not RUNNING', {
        jobId,
        runId: job.runId,
        status: job.status,
        stepId: job.stepId,
      })
      return
    }

    await this.workflowRunRepository.updateStepStatus(
      job.stepId,
      {
        status: WorkflowStepStatus.RUNNING,
      },
      {
        onlyIfStatusIn: [WorkflowStepStatus.QUEUED],
      },
    )
  }

  /**
   * Advances the workflow after a child execution job completes successfully.
   *
   * No-ops when the job is not linked to a run/step (valid), when the step is
   * already terminal (idempotent duplicate), or when the reloaded job is not
   * `COMPLETED` (integrity failure — logged, no advance). Completes the
   * current step with the job's result as its output, then activates the next
   * `JOB` step, completes the run when no steps remain, or parks the run in
   * `AWAITING_APPROVAL` when the next step is `APPROVAL`.
   *
   * @param jobId - Primary key of the completed execution job.
   */
  async onJobCompleted(jobId: string): Promise<void> {
    const linked = await this.executionJobRepository.findById(jobId)

    if (linked?.runId == null || linked.stepId == null) {
      return
    }

    await this.database.withTransaction(async (transaction) => {
      const run = await this.workflowRunRepository.lockById(linked.runId!, { transaction })

      if (!run) {
        this.logger.error('Linked execution job references a missing workflow run', {
          jobId,
          runId: linked.runId,
        })
        return
      }

      const step = run.steps.find((candidate) => candidate.id === linked.stepId)

      if (!step) {
        this.logger.error('Linked execution job references a missing workflow step', {
          jobId,
          runId: run.id,
          stepId: linked.stepId,
        })
        return
      }

      if (step.isTerminal) {
        this.logger.debug('Ignoring duplicate job-completed callback for terminal step', {
          jobId,
          runId: run.id,
          stepId: step.id,
        })
        return
      }

      const job = await this.executionJobRepository.findById(jobId, { transaction })

      if (job?.status !== ExecutionJobStatus.COMPLETED) {
        this.logger.error('onJobCompleted received a job that is not COMPLETED', {
          jobId,
          runId: run.id,
          status: job?.status ?? null,
          stepId: step.id,
        })
        return
      }

      await this.transitioner.completeStepAndAdvance({
        guardStatuses: [WorkflowStepStatus.QUEUED, WorkflowStepStatus.RUNNING],
        output: job.result,
        run,
        step,
        transaction,
      })
    })
  }

  /**
   * Fails the workflow after a child execution job fails terminally.
   *
   * No-ops when the job is not linked to a run/step (valid), when the step is
   * already terminal (idempotent duplicate), or when the reloaded job is not
   * `FAILED` (integrity failure — logged, no fail). Marks the step and run
   * `FAILED` in one transaction with a sanitized failure payload.
   *
   * @param jobId - Primary key of the failed execution job.
   */
  async onJobFailed(jobId: string): Promise<void> {
    const linked = await this.executionJobRepository.findById(jobId)

    if (linked?.runId == null || linked.stepId == null) {
      return
    }

    await this.database.withTransaction(async (transaction) => {
      const run = await this.workflowRunRepository.lockById(linked.runId!, { transaction })

      if (!run) {
        this.logger.error('Linked execution job references a missing workflow run', {
          jobId,
          runId: linked.runId,
        })
        return
      }

      const step = run.steps.find((candidate) => candidate.id === linked.stepId)

      if (!step) {
        this.logger.error('Linked execution job references a missing workflow step', {
          jobId,
          runId: run.id,
          stepId: linked.stepId,
        })
        return
      }

      if (step.isTerminal) {
        this.logger.debug('Ignoring duplicate job-failed callback for terminal step', {
          jobId,
          runId: run.id,
          stepId: step.id,
        })
        return
      }

      const job = await this.executionJobRepository.findById(jobId, { transaction })

      if (job?.status !== ExecutionJobStatus.FAILED) {
        this.logger.error('onJobFailed received a job that is not FAILED', {
          jobId,
          runId: run.id,
          status: job?.status ?? null,
          stepId: step.id,
        })
        return
      }

      await this.transitioner.failStepAndRun({
        failure: sanitizeWorkflowRunFailure(job.failure),
        guardStatuses: [WorkflowStepStatus.QUEUED, WorkflowStepStatus.RUNNING],
        run,
        step,
        transaction,
      })
    })
  }
}
