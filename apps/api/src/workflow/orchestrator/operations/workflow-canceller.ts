// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { Database } from '@/infraestructure/database'
import { ExecutionJobService } from '../../../execution/execution-job.service'
import { WorkflowRunStatus, WorkflowStepStatus } from '../../datatypes'
import { WorkflowCancelError } from '../../error/error'
import type { WorkflowRun } from '../../models/workflow-run'
import { WORKFLOW_RUN_REPOSITORY, type WorkflowRunRepository } from '../../repository'

/**
 * Run statuses a cancellation may still be applied to.
 */
const CancellableRunStatuses: readonly WorkflowRunStatus[] = [
  WorkflowRunStatus.AWAITING_APPROVAL,
  WorkflowRunStatus.PENDING,
  WorkflowRunStatus.RUNNING,
]

/**
 * Step statuses that are cancelled together with the run.
 */
const CancellableStepStatuses: readonly WorkflowStepStatus[] = [
  WorkflowStepStatus.AWAITING_APPROVAL,
  WorkflowStepStatus.PENDING,
  WorkflowStepStatus.QUEUED,
  WorkflowStepStatus.RUNNING,
]

/**
 * Cancels in-flight workflow runs on operator request.
 *
 * Owns the cancellation flow only: moving a non-terminal run and its
 * non-terminal steps to `CANCELLED` and requesting cancellation of the run's
 * active child execution jobs, all in one transaction. Starting, advancing,
 * and approval decisions live in their own collaborators behind
 * {@link WorkflowOrchestrator}.
 *
 * Concurrency is resolved with optimistic status guards: the run update
 * applies only while the run is still cancellable, so a terminal transition
 * that commits first wins and the cancellation fails with
 * {@link WorkflowCancelError} instead of overwriting it. `RUNNING` child jobs
 * keep executing until their node observes `cancellationRequestedAt`; their
 * eventual terminal callbacks degrade to no-ops because the cancelled steps
 * no longer pass the advance guards.
 */
@Injectable()
export class WorkflowCanceller {
  // MARK: - Constructor

  /**
   * Creates a workflow canceller.
   *
   * @param database - Database client used for cancellation transactions.
   * @param executionJobService - Service used to cancel child execution jobs.
   * @param workflowRunRepository - Persistence port for runs and steps.
   */
  constructor(
    private readonly database: Database,
    @Inject(forwardRef(() => ExecutionJobService))
    private readonly executionJobService: ExecutionJobService,
    @Inject(WORKFLOW_RUN_REPOSITORY)
    private readonly workflowRunRepository: WorkflowRunRepository,
  ) {}

  // MARK: - Instance methods

  /**
   * Cancels a workflow run and its in-flight work.
   *
   * Moves the run to `CANCELLED` (releasing its `activeKey` for reuse by a
   * later run), cancels every non-terminal step, moves the run's `QUEUED`
   * child jobs to `CANCELLED`, and flags `RUNNING` child jobs with
   * `cancellationRequestedAt`. All writes commit in one transaction; when the
   * run reaches a terminal state first, nothing is written.
   *
   * @param runId - Primary key of the run to cancel.
   * @returns The refreshed run after cancellation; `null` when the run does not exist.
   * @throws {@link WorkflowCancelError} When the run is already terminal,
   *   including when a concurrent terminal transition wins the race.
   */
  async cancel(runId: string): Promise<WorkflowRun | null> {
    const run = await this.workflowRunRepository.findById(runId)

    if (!run) {
      return null
    }

    if (!CancellableRunStatuses.includes(run.status)) {
      throw new WorkflowCancelError(runId, `Workflow run ${runId} is already ${run.status} and cannot be cancelled`)
    }

    await this.database.withTransaction(async (transaction) => {
      const cancelled = await this.workflowRunRepository.updateRunStatus(
        run.id,
        {
          activeKey: null,
          status: WorkflowRunStatus.CANCELLED,
        },
        {
          onlyIfStatusIn: CancellableRunStatuses,
          transaction,
        },
      )

      if (!cancelled) {
        throw new WorkflowCancelError(runId, `Workflow run ${runId} reached a terminal state and cannot be cancelled`)
      }

      for (const step of run.steps) {
        if (!CancellableStepStatuses.includes(step.status)) {
          continue
        }

        await this.workflowRunRepository.updateStepStatus(
          step.id,
          {
            status: WorkflowStepStatus.CANCELLED,
          },
          {
            onlyIfStatusIn: CancellableStepStatuses,
            transaction,
          },
        )
      }

      await this.executionJobService.requestCancellationForRun(run.id, { transaction })
    })

    return this.workflowRunRepository.findById(runId)
  }
}
