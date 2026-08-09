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
 * Owns the cancellation flow only: locking the run, moving it and its
 * non-terminal steps to `CANCELLED`, and requesting cancellation of the run's
 * active child execution jobs, all in one transaction. The run row is locked
 * with `SELECT ... FOR UPDATE` before any step or job writes so cancel and
 * advance share one lock order.
 *
 * When the run is already terminal under the lock, cancellation fails with
 * {@link WorkflowCancelError}. `RUNNING` child jobs keep executing until their
 * node observes `cancellationRequestedAt`; their eventual terminal callbacks
 * degrade to no-ops because the cancelled steps no longer pass the advance
 * guards.
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
   * Locks the run, moves it to `CANCELLED` (releasing its `activeKey`),
   * cancels every non-terminal step, moves the run's `QUEUED` child jobs to
   * `CANCELLED`, and flags `RUNNING` child jobs with `cancellationRequestedAt`.
   *
   * @param runId - Primary key of the run to cancel.
   * @returns The refreshed run after cancellation; `null` when the run does not exist.
   * @throws {@link WorkflowCancelError} When the run is already terminal,
   *   including when a concurrent terminal transition wins the race.
   */
  async cancel(runId: string): Promise<WorkflowRun | null> {
    return this.database.withTransaction(async (transaction) => {
      const run = await this.workflowRunRepository.lockById(runId, { transaction })

      if (!run) {
        return null
      }

      if (!CancellableRunStatuses.includes(run.status)) {
        throw new WorkflowCancelError(runId, `Workflow run ${runId} is already ${run.status} and cannot be cancelled`)
      }

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

      return this.workflowRunRepository.findById(runId, { transaction })
    })
  }
}
