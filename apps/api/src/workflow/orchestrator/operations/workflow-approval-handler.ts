// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { Database } from '@/infraestructure/database'
import { WorkflowStepStatus } from '../../datatypes'
import { WorkflowApprovalError } from '../../error/error'
import { WorkflowTransitioner } from '../transitions'
import type { WorkflowRun } from '../../models/workflow-run'
import type { WorkflowStep } from '../../models/workflow-step'
import { WORKFLOW_RUN_REPOSITORY, type WorkflowRunRepository } from '../../repository'

/**
 * Applies human approval decisions to parked workflow runs.
 *
 * Owns the approval flow only: locating the step awaiting approval and
 * delegating the resulting transition to {@link WorkflowTransitioner} inside
 * one transaction. Job-driven advancing lives in its own collaborator behind
 * {@link WorkflowOrchestrator}.
 */
@Injectable()
export class WorkflowApprovalHandler {
  // MARK: - Constructor

  /**
   * Creates a workflow approval handler.
   *
   * @param database - Database client used for decision transactions.
   * @param transitioner - Transition writer applying step and run updates.
   * @param workflowRunRepository - Persistence port for runs and steps.
   */
  constructor(
    private readonly database: Database,
    private readonly transitioner: WorkflowTransitioner,
    @Inject(WORKFLOW_RUN_REPOSITORY)
    private readonly workflowRunRepository: WorkflowRunRepository,
  ) {}

  // MARK: - Instance methods

  /**
   * Applies a positive approval decision to a parked run.
   *
   * Completes the step awaiting approval, then activates the next `JOB` step
   * (returning the run to `RUNNING`) with a payload resolved from the run's
   * definition, parks again when the next step is another `APPROVAL`, or
   * completes the run when no steps remain. All writes commit in one
   * transaction; concurrent decisions are resolved by an optimistic status
   * guard so only one decision applies.
   *
   * @param runId - Primary key of the run awaiting approval.
   * @returns The refreshed run after the decision; `null` when the run does not exist.
   * @throws {@link WorkflowApprovalError} When no step is awaiting approval.
   */
  async approve(runId: string): Promise<WorkflowRun | null> {
    const run = await this.workflowRunRepository.findById(runId)

    if (!run) {
      return null
    }

    const approvalStep = this.resolveAwaitingApprovalStep(run)

    await this.database.withTransaction(async (transaction) => {
      await this.transitioner.completeStepAndAdvance({
        guardStatuses: [WorkflowStepStatus.AWAITING_APPROVAL],
        run,
        step: approvalStep,
        transaction,
      })
    })

    return this.workflowRunRepository.findById(runId)
  }

  /**
   * Applies a negative approval decision to a parked run.
   *
   * Fails the step awaiting approval and the run in one transaction. The run's
   * failure payload records the rejected step. Concurrent decisions are
   * resolved by an optimistic status guard so only one decision applies.
   *
   * @param runId - Primary key of the run awaiting approval.
   * @returns The refreshed run after the decision; `null` when the run does not exist.
   * @throws {@link WorkflowApprovalError} When no step is awaiting approval.
   */
  async reject(runId: string): Promise<WorkflowRun | null> {
    const run = await this.workflowRunRepository.findById(runId)

    if (!run) {
      return null
    }

    const approvalStep = this.resolveAwaitingApprovalStep(run)

    await this.database.withTransaction(async (transaction) => {
      await this.transitioner.failStepAndRun({
        failure: {
          code: 'WORKFLOW_APPROVAL_REJECTED',
          message: `Approval step ${approvalStep.key} was rejected`,
        },
        guardStatuses: [WorkflowStepStatus.AWAITING_APPROVAL],
        run,
        step: approvalStep,
        transaction,
      })
    })

    return this.workflowRunRepository.findById(runId)
  }

  // MARK: - Private methods

  private resolveAwaitingApprovalStep(run: WorkflowRun): WorkflowStep {
    const approvalStep = run.steps.find((candidate) => candidate.status === WorkflowStepStatus.AWAITING_APPROVAL)

    if (!approvalStep) {
      throw new WorkflowApprovalError(run.id, `Workflow run ${run.id} has no step awaiting approval`)
    }

    return approvalStep
  }
}
