// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { forwardRef, Inject, Injectable } from '@nestjs/common'
import type { DatabaseTransaction } from '@/infraestructure/database'
import { ExecutionJobService } from '../../../execution/execution-job.service'
import type { ExecutionJob } from '../../../execution/models/execution-job'
import type { ExecutionJobSource } from '../../../execution/models/execution-job-source'
import { WorkflowRunStatus, WorkflowStepKind, WorkflowStepStatus } from '../../datatypes'
import { WorkflowAdvanceError } from '../../error/error'
import type { WorkflowRun } from '../../models/workflow-run'
import type { WorkflowStep } from '../../models/workflow-step'
import { WORKFLOW_RUN_REPOSITORY, type WorkflowRunRepository } from '../../repository'

/**
 * Parameters for activating an `APPROVAL` step.
 */
interface ActivateApprovalStepParameters {
  /**
   * Approval step to park the run on. Must belong to the run being advanced;
   * its `runId` selects the run that is moved to `AWAITING_APPROVAL`.
   */
  readonly step: WorkflowStep

  /**
   * Open transaction the activation writes join. The caller owns commit and
   * rollback.
   */
  readonly transaction: DatabaseTransaction
}

/**
 * Parameters for activating a `JOB` step.
 */
interface ActivateJobStepParameters {
  /**
   * Opaque payload handed to the child execution job. Typically the run input
   * for the first step, or the previous step's output afterwards.
   */
  readonly payload: unknown

  /**
   * Queue priority for the child execution job. Defaults to `0`.
   */
  readonly priority?: number

  /**
   * External origin recorded on the child execution job. Omit for jobs the
   * workflow spawns on its own; set it for entrypoint-triggered first steps
   * (for example a webhook delivery).
   */
  readonly source?: ExecutionJobSource

  /**
   * Step to activate. Must be a `JOB` step with a `jobKind`; anything else
   * fails the transition with {@link WorkflowAdvanceError}.
   */
  readonly step: WorkflowStep

  /**
   * Open transaction the activation writes join. The caller owns commit and
   * rollback.
   */
  readonly transaction: DatabaseTransaction
}

/**
 * Parameters for completing a step and advancing its run.
 */
interface CompleteStepAndAdvanceParameters {
  /**
   * Statuses the step must still be in for the completion to apply.
   *
   * Acts as an optimistic guard: when the step already left these statuses
   * (for example a concurrent retry or decision won the race), the whole
   * transition becomes a no-op so callers cannot double-advance the run.
   */
  readonly guardStatuses: readonly WorkflowStepStatus[]

  /**
   * Output persisted on the completed step, such as the child job's result.
   * Omit when the step produces none (for example an approval decision);
   * the step's stored output is then left untouched.
   */
  readonly output?: unknown

  /**
   * Payload handed to the next `JOB` step when one is activated. Ignored when
   * the run completes or parks on an approval instead.
   */
  readonly payload: unknown

  /**
   * Result persisted on the run when the completed step was the last one.
   * Ignored while more steps remain.
   */
  readonly result: unknown

  /**
   * Run that owns {@link CompleteStepAndAdvanceParameters#step}. Its loaded
   * `steps` decide what comes next and its `status` decides whether a resume
   * write back to `RUNNING` is needed.
   */
  readonly run: WorkflowRun

  /**
   * Step to complete.
   */
  readonly step: WorkflowStep

  /**
   * Open transaction the transition writes join. The caller owns commit and
   * rollback.
   */
  readonly transaction: DatabaseTransaction
}

/**
 * Parameters for failing a step together with its run.
 */
interface FailStepAndRunParameters {
  /**
   * Sanitized failure payload persisted on the run, such as the child job's
   * failure or an approval-rejection record. Stored as-is; callers must not
   * include internal diagnostics.
   */
  readonly failure: unknown

  /**
   * Statuses the step must still be in for the failure to apply.
   *
   * Acts as an optimistic guard: when the step already left these statuses
   * (for example a concurrent retry or decision won the race), the whole
   * transition becomes a no-op so callers cannot double-fail the run.
   */
  readonly guardStatuses: readonly WorkflowStepStatus[]

  /**
   * Run that owns {@link FailStepAndRunParameters#step} and is moved to
   * `FAILED` with it.
   */
  readonly run: WorkflowRun

  /**
   * Step to fail.
   */
  readonly step: WorkflowStep

  /**
   * Open transaction the transition writes join. The caller owns commit and
   * rollback.
   */
  readonly transaction: DatabaseTransaction
}

/**
 * Applies workflow step and run transitions inside a caller-owned transaction.
 *
 * Owns the four write sequences shared by the start, advance, and approval
 * flows:
 * - {@link activateJobStep} — enqueue a child execution job and queue its step,
 * - {@link activateApprovalStep} — park a run on a human approval gate,
 * - {@link completeStepAndAdvance} — finish a step and move the run forward,
 * - {@link failStepAndRun} — fail a step and its run terminally.
 *
 * Each transition exists here exactly once so the job-driven and
 * approval-driven paths cannot drift apart.
 *
 * Concurrency is handled with optimistic status guards: transitions that race
 * (duplicate job callbacks, competing approval decisions) degrade to no-ops
 * instead of double-applying. Callers open the transaction and pass it in;
 * this class never commits on its own, so a flow's transitions always commit
 * atomically with the caller's other writes — and any error thrown here rolls
 * the whole flow back.
 *
 * Persistence failures propagate as the repository's domain errors
 * (`WorkflowStepUpdateError`, `WorkflowRunUpdateError`) or the execution
 * module's `ExecutionJobCreateError`; this class adds no error handling of
 * its own.
 */
@Injectable()
export class WorkflowTransitioner {
  // MARK: - Constructor

  /**
   * Creates a workflow transitioner.
   *
   * @param executionJobService - Service used to enqueue child execution jobs.
   * @param workflowRunRepository - Persistence port for runs and steps.
   */
  constructor(
    @Inject(forwardRef(() => ExecutionJobService))
    private readonly executionJobService: ExecutionJobService,
    @Inject(WORKFLOW_RUN_REPOSITORY)
    private readonly workflowRunRepository: WorkflowRunRepository,
  ) {}

  // MARK: - Instance methods

  /**
   * Parks a run on an `APPROVAL` step until a human decision arrives.
   *
   * Two writes, both in the caller's transaction: the step moves to
   * `AWAITING_APPROVAL` with `startedAt` stamped, then the owning run moves to
   * `AWAITING_APPROVAL`. From there only an approval decision (approve or
   * reject) resumes or terminates the run; job callbacks no longer apply.
   *
   * No status guard is applied: callers reach this only from a transition
   * that already won its own guard.
   *
   * @param parameters - Approval step and enclosing transaction.
   */
  async activateApprovalStep(parameters: ActivateApprovalStepParameters): Promise<void> {
    const { step, transaction } = parameters

    await this.workflowRunRepository.updateStepStatus(
      step.id,
      {
        startedAt: new Date(),
        status: WorkflowStepStatus.AWAITING_APPROVAL,
      },
      { transaction },
    )

    await this.workflowRunRepository.updateRunStatus(
      step.runId,
      {
        status: WorkflowRunStatus.AWAITING_APPROVAL,
      },
      { transaction },
    )
  }

  /**
   * Activates a `JOB` step by handing its work to the execution domain.
   *
   * Enqueues a child execution job with the step's `jobKind`, the given
   * payload, and back-references (`runId`, `stepId`) that later let the
   * advance flow find its way back to this step when the job terminates. The
   * step then moves to `QUEUED` with `startedAt` stamped. The run's own
   * status is not touched; callers manage it.
   *
   * The job is created with the initial payload version, empty policy, and no
   * capability requirements — any Node advertising support for the kind may
   * claim it.
   *
   * @param parameters - Payload, optional priority, job step, and transaction.
   * @returns The enqueued child execution job.
   * @throws {@link WorkflowAdvanceError} When the step is not a `JOB` with a `jobKind`.
   */
  async activateJobStep(parameters: ActivateJobStepParameters): Promise<ExecutionJob> {
    const { payload, priority = 0, source, step, transaction } = parameters

    if (step.kind !== WorkflowStepKind.JOB || step.jobKind == null) {
      throw new WorkflowAdvanceError(step.runId, `Workflow step ${step.key} must be a JOB with jobKind to activate`)
    }

    const job = await this.executionJobService.create(
      {
        kind: step.jobKind,
        payload,
        payloadVersion: 1,
        policy: {},
        priority,
        runId: step.runId,
        source,
        stepId: step.id,
        requirements: {
          allOf: [],
        },
      },
      { transaction },
    )

    await this.workflowRunRepository.updateStepStatus(
      step.id,
      {
        startedAt: new Date(),
        status: WorkflowStepStatus.QUEUED,
      },
      { transaction },
    )

    return job
  }

  /**
   * Completes a step and advances its run to whatever comes next.
   *
   * First applies the guarded step completion (`COMPLETED`, `completedAt`,
   * optional output). When the guard loses — the step already left
   * `guardStatuses` because a concurrent caller applied first — the whole
   * transition is a no-op and nothing else is written.
   *
   * When the guard wins, exactly one of three outcomes follows, by position
   * order of the run's steps:
   * - **No step remains** — the run moves to `COMPLETED` with the given
   *   result and its `activeKey` is released for reuse by a later run.
   * - **Next step is `APPROVAL`** — the run parks via
   *   {@link activateApprovalStep}.
   * - **Next step is `JOB`** — the step is activated via
   *   {@link activateJobStep} with the given payload; when the run was parked
   *   (for example resuming from an approval), it is first moved back to
   *   `RUNNING`.
   *
   * @param parameters - Guard, step outcome, next-step payload, and transaction.
   * @throws {@link WorkflowAdvanceError} When the next step cannot be activated.
   */
  async completeStepAndAdvance(parameters: CompleteStepAndAdvanceParameters): Promise<void> {
    const { guardStatuses, output, payload, result, run, step, transaction } = parameters
    const completedAt = new Date()
    const nextStep = run.steps.find((candidate) => candidate.position > step.position)

    const stepped = await this.workflowRunRepository.updateStepStatus(
      step.id,
      {
        completedAt,
        output,
        status: WorkflowStepStatus.COMPLETED,
      },
      {
        onlyIfStatusIn: guardStatuses,
        transaction,
      },
    )

    if (!stepped) {
      return
    }

    if (!nextStep) {
      await this.workflowRunRepository.updateRunStatus(
        run.id,
        {
          activeKey: null,
          completedAt,
          result,
          status: WorkflowRunStatus.COMPLETED,
        },
        { transaction },
      )
      return
    }

    if (nextStep.kind === WorkflowStepKind.APPROVAL) {
      await this.activateApprovalStep({ step: nextStep, transaction })
      return
    }

    if (run.status !== WorkflowRunStatus.RUNNING) {
      await this.workflowRunRepository.updateRunStatus(
        run.id,
        {
          status: WorkflowRunStatus.RUNNING,
        },
        { transaction },
      )
    }

    await this.activateJobStep({
      payload,
      step: nextStep,
      transaction,
    })
  }

  /**
   * Fails a step together with its run, terminally.
   *
   * First applies the guarded step failure (`FAILED`, `failedAt`). When the
   * guard loses — the step already left `guardStatuses` because a concurrent
   * caller applied first — the whole transition is a no-op and the run is
   * left untouched.
   *
   * When the guard wins, the run moves to `FAILED` with the same `failedAt`
   * and the given failure payload, and its `activeKey` is released for reuse
   * by a later run. Both states are terminal; no further advance or approval
   * decision applies to the run afterwards.
   *
   * @param parameters - Guard, failure payload, step, run, and transaction.
   */
  async failStepAndRun(parameters: FailStepAndRunParameters): Promise<void> {
    const { failure, guardStatuses, run, step, transaction } = parameters
    const failedAt = new Date()

    const stepped = await this.workflowRunRepository.updateStepStatus(
      step.id,
      {
        failedAt,
        status: WorkflowStepStatus.FAILED,
      },
      {
        onlyIfStatusIn: guardStatuses,
        transaction,
      },
    )

    if (!stepped) {
      return
    }

    await this.workflowRunRepository.updateRunStatus(
      run.id,
      {
        activeKey: null,
        failedAt,
        failure,
        status: WorkflowRunStatus.FAILED,
      },
      { transaction },
    )
  }
}
