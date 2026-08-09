// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { Database } from '@/infraestructure/database'
import { WorkflowApprovalError } from '../../error/error'
import { WorkflowTransitioner } from '../transitions'
import type { WorkflowApprovalDecision } from '../../models/workflow-approval-decision'
import type { WorkflowRun } from '../../models/workflow-run'
import type { WorkflowStep } from '../../models/workflow-step'
import { sanitizeWorkflowRunFailure } from '../../sanitize'
import type { DecideWorkflowRunApprovalParameters } from '../../parameters'
import { isUniqueConstraintViolation, WORKFLOW_RUN_REPOSITORY, type WorkflowRunRepository } from '../../repository'
import {
  WorkflowApprovalDecisionOutcome,
  WorkflowRunFailureCode,
  WorkflowStepKind,
  WorkflowStepStatus,
} from '../../datatypes'

/**
 * Applies human approval decisions to parked workflow runs.
 *
 * Owns the approval command flow: locking the run, verifying the named step is
 * the current approval gate, persisting a unique audit decision, then
 * delegating the transition to {@link WorkflowTransitioner} inside one
 * transaction. Repeated {@link DecideWorkflowRunApprovalParameters.decisionId}
 * values are idempotent; decisions aimed at an obsolete step fail with
 * {@link WorkflowApprovalError}.
 */
@Injectable()
export class WorkflowApprovalHandler {
  // MARK: - Constructor

  /**
   * Creates a workflow approval handler.
   *
   * @param database - Database client used for decision transactions.
   * @param transitioner - Transition writer applying step and run updates.
   * @param workflowRunRepository - Persistence port for runs, steps, and decisions.
   */
  constructor(
    private readonly database: Database,
    private readonly transitioner: WorkflowTransitioner,
    @Inject(WORKFLOW_RUN_REPOSITORY)
    private readonly workflowRunRepository: WorkflowRunRepository,
  ) {}

  // MARK: - Instance methods

  /**
   * Applies a positive approval decision command.
   *
   * @param parameters - Approval decision command.
   * @returns The refreshed run after the decision; `null` when the run does not exist.
   * @throws {@link WorkflowApprovalError} When the step is obsolete or the
   *   decision id conflicts with a different command.
   */
  async approve(parameters: DecideWorkflowRunApprovalParameters): Promise<WorkflowRun | null> {
    return this.decide(parameters, WorkflowApprovalDecisionOutcome.APPROVED)
  }

  /**
   * Applies a negative approval decision command.
   *
   * @param parameters - Approval decision command.
   * @returns The refreshed run after the decision; `null` when the run does not exist.
   * @throws {@link WorkflowApprovalError} When the step is obsolete or the
   *   decision id conflicts with a different command.
   */
  async reject(parameters: DecideWorkflowRunApprovalParameters): Promise<WorkflowRun | null> {
    return this.decide(parameters, WorkflowApprovalDecisionOutcome.REJECTED)
  }

  // MARK: - Private methods

  private async decide(
    parameters: DecideWorkflowRunApprovalParameters,
    outcome: WorkflowApprovalDecisionOutcome,
  ): Promise<WorkflowRun | null> {
    return this.database.withTransaction(async (transaction) => {
      const run = await this.workflowRunRepository.lockById(parameters.runId, { transaction })

      if (!run) {
        return null
      }

      const existing = await this.workflowRunRepository.findApprovalDecisionByDecisionId(parameters.decisionId, {
        transaction,
      })

      if (existing) {
        this.assertIdempotentDecision(parameters, outcome, existing)
        return this.workflowRunRepository.findById(parameters.runId, { transaction })
      }

      const approvalStep = this.resolveCurrentApprovalStep(run, parameters.stepId)

      try {
        await this.workflowRunRepository.createApprovalDecision(
          {
            actorId: parameters.actorId,
            decisionId: parameters.decisionId,
            outcome,
            reason: parameters.reason,
            runId: parameters.runId,
            stepId: parameters.stepId,
          },
          { transaction },
        )
      } catch (error) {
        if (!isUniqueConstraintViolation(error)) {
          throw error
        }

        const raced = await this.workflowRunRepository.findApprovalDecisionByDecisionId(parameters.decisionId, {
          transaction,
        })

        if (!raced) {
          throw error
        }

        this.assertIdempotentDecision(parameters, outcome, raced)
        return this.workflowRunRepository.findById(parameters.runId, { transaction })
      }

      if (outcome === WorkflowApprovalDecisionOutcome.APPROVED) {
        await this.transitioner.completeStepAndAdvance({
          guardStatuses: [WorkflowStepStatus.AWAITING_APPROVAL],
          run,
          step: approvalStep,
          transaction,
        })
      } else {
        await this.transitioner.failStepAndRun({
          guardStatuses: [WorkflowStepStatus.AWAITING_APPROVAL],
          run,
          step: approvalStep,
          transaction,
          failure: sanitizeWorkflowRunFailure({
            code: WorkflowRunFailureCode.APPROVAL_REJECTED,
            message: parameters.reason ?? `Approval step ${approvalStep.key} was rejected`,
          }),
        })
      }

      return this.workflowRunRepository.findById(parameters.runId, { transaction })
    })
  }

  private assertIdempotentDecision(
    parameters: DecideWorkflowRunApprovalParameters,
    outcome: WorkflowApprovalDecisionOutcome,
    existing: WorkflowApprovalDecision,
  ): void {
    if (
      existing.runId === parameters.runId &&
      existing.stepId === parameters.stepId &&
      existing.outcome === outcome &&
      existing.actorId === parameters.actorId
    ) {
      return
    }

    throw new WorkflowApprovalError(
      parameters.runId,
      `Workflow approval decision ${parameters.decisionId} conflicts with an existing decision`,
    )
  }

  private resolveCurrentApprovalStep(run: WorkflowRun, stepId: string): WorkflowStep {
    const current = run.steps.find((candidate) => candidate.status === WorkflowStepStatus.AWAITING_APPROVAL)

    if (!current || current.id !== stepId) {
      throw new WorkflowApprovalError(run.id, `Workflow run ${run.id} step ${stepId} is not the current approval step`)
    }

    if (current.kind !== WorkflowStepKind.APPROVAL) {
      throw new WorkflowApprovalError(run.id, `Workflow run ${run.id} step ${current.key} is not an APPROVAL step`)
    }

    return current
  }
}
