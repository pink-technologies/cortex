// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { forwardRef, Inject, Injectable } from '@nestjs/common'
import type { DatabaseTransaction } from '@/infraestructure/database'
import { ExecutionJobService } from '../../../execution/execution-job.service'
import type { ExecutionJob } from '../../../execution/models/execution-job'
import type { ExecutionJobSource } from '../../../execution/models/execution-job-source'
import { resolveWorkflowStepPayload, WorkflowStepPayloadContextBuilder } from '../../definitions/payload'
import { WorkflowRunStatus, WorkflowStepKind, WorkflowStepStatus } from '../../datatypes'
import type { WorkflowStepPayloadContext } from '../../definitions/models'
import { WorkflowDefinitionRegistry } from '../../definitions/registry'
import { WorkflowAdvanceError } from '../../error/error'
import type { WorkflowRun } from '../../models/workflow-run'
import type { WorkflowRunFailure } from '../../models/workflow-run-failure'
import type { WorkflowStep } from '../../models/workflow-step'
import type { UpdateWorkflowRunStatusParameters } from '../../parameters'
import { WORKFLOW_RUN_REPOSITORY, type WorkflowRunRepository } from '../../repository'

/**
 * Run statuses that may still accept a step advance.
 *
 * Used as an optimistic guard after a step completion wins so a concurrent
 * terminal transition (cancel/fail) cannot be overwritten by enqueueing the
 * next job or promoting the run back to `RUNNING`.
 */
const AdvancingRunStatuses: readonly WorkflowRunStatus[] = [
  WorkflowRunStatus.AWAITING_APPROVAL,
  WorkflowRunStatus.RUNNING,
]

/**
 * Parameters for {@link WorkflowTransitioner.activateApprovalStep} — parking
 * a run on a human approval gate.
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
 * Parameters for {@link WorkflowTransitioner.activateJobStep} — enqueueing a
 * child execution job and queueing its step.
 */
interface ActivateJobStepParameters {
  /**
   * Opaque payload carried by the child execution job and validated by the
   * Node handler for the step's `jobKind`. Callers resolve it from the run's
   * definition: the step's `buildPayload` when declared, otherwise the most
   * recent step output falling back to the run input.
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
 * Parameters for {@link WorkflowTransitioner.completeStepAndAdvance} —
 * finishing a step and moving its run to the next step, an approval park, or
 * completion.
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
   * It also enters the payload context handed to the next `JOB` step's
   * builder and, when this was the last step, becomes the run's `result`.
   * Omit when the step produces none (for example an approval decision);
   * the step's stored output is then left untouched and the most recent
   * prior output carries forward instead.
   */
  readonly output?: unknown

  /**
   * Run that owns {@link CompleteStepAndAdvanceParameters#step}. Supplies the
   * ordered `steps` that decide what comes next and whose stored outputs feed
   * payload building, the `definitionKey` / `definitionVersion` resolved for
   * `buildPayload` lookups, the `input` used as the payload fallback, and the
   * `status` that decides whether a resume write back to `RUNNING` is needed.
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
 * Parameters for {@link WorkflowTransitioner.failStepAndRun} — failing a step
 * and its run terminally.
 */
interface FailStepAndRunParameters {
  /**
   * Sanitized failure payload persisted on the run.
   *
   * Callers must pass values through {@link sanitizeWorkflowRunFailure} (or
   * construct an already-public {@link WorkflowRunFailure}) before invoking
   * this transition.
   */
  readonly failure: WorkflowRunFailure

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
 * Concurrency uses a single lock order: each mutating method first locks the
 * run with `SELECT ... FOR UPDATE` (callers that already hold the lock simply
 * re-acquire it in the same transaction), reloads steps, then updates steps
 * and the run. Optimistic status guards remain as a second line of defense.
 * After a step guard wins, further run writes require the run to still be
 * {@link AdvancingRunStatuses}; when a concurrent cancel/fail already moved the
 * run terminal, the advance throws {@link WorkflowAdvanceError} so the
 * caller's transaction rolls back. Callers open the transaction and pass it
 * in; this class never commits on its own.
 *
 * Next-step payloads are resolved from the run's registered definition: a
 * step's `buildPayload` when declared, otherwise the most recent step output
 * falling back to the run input. Payload-builder failures surface as
 * {@link WorkflowAdvanceError} with the original error in `cause`.
 *
 * Persistence failures propagate as the repository's domain errors
 * (`WorkflowStepUpdateError`, `WorkflowRunUpdateError`) or the execution
 * module's `ExecutionJobCreateError`; this class adds no other error
 * handling of its own.
 */
@Injectable()
export class WorkflowTransitioner {
  // MARK: - Constructor

  /**
   * Creates a workflow transitioner.
   *
   * @param definitionRegistry - Registry resolving definitions for payload building.
   * @param executionJobService - Service used to enqueue child execution jobs.
   * @param workflowRunRepository - Persistence port for runs and steps.
   */
  constructor(
    private readonly definitionRegistry: WorkflowDefinitionRegistry,
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
   * `AWAITING_APPROVAL` only while it is still {@link AdvancingRunStatuses}.
   * From there only an approval decision (approve or reject) resumes or
   * terminates the run; job callbacks no longer apply.
   *
   * @param parameters - Approval step and enclosing transaction.
   * @throws {@link WorkflowAdvanceError} When the run left
   *   {@link AdvancingRunStatuses} before the park could apply.
   */
  async activateApprovalStep(parameters: ActivateApprovalStepParameters): Promise<void> {
    await this.workflowRunRepository.updateStepStatus(
      parameters.step.id,
      {
        startedAt: new Date(),
        status: WorkflowStepStatus.AWAITING_APPROVAL,
      },
      { transaction: parameters.transaction },
    )

    await this.claimAdvanceableRunStatus(
      parameters.step.runId,
      {
        status: WorkflowRunStatus.AWAITING_APPROVAL,
      },
      parameters.transaction,
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
    if (parameters.step.kind !== WorkflowStepKind.JOB || parameters.step.jobKind == null) {
      throw new WorkflowAdvanceError(
        parameters.step.runId,
        `Workflow step ${parameters.step.key} must be a JOB with jobKind to activate`,
      )
    }

    const job = await this.executionJobService.create(
      {
        kind: parameters.step.jobKind,
        payload: parameters.payload,
        payloadVersion: 1,
        policy: {},
        priority: parameters.priority ?? 0,
        runId: parameters.step.runId,
        source: parameters.source,
        stepId: parameters.step.id,
        requirements: {
          allOf: [],
        },
      },
      { transaction: parameters.transaction },
    )

    await this.workflowRunRepository.updateStepStatus(
      parameters.step.id,
      {
        startedAt: new Date(),
        status: WorkflowStepStatus.QUEUED,
      },
      { transaction: parameters.transaction },
    )

    return job
  }

  /**
   * Completes a step and advances its run to whatever comes next.
   *
   * Locks the run, reloads steps, then applies the guarded step completion.
   * When the step already left `guardStatuses`, the transition is a no-op.
   *
   * When the guard wins, exactly one of three outcomes follows, by position
   * order of the run's steps. Each outcome first claims the run is still in
   * {@link AdvancingRunStatuses}; when that claim loses, this method throws so
   * the caller's transaction rolls back the step completion:
   * - **No step remains** — the run moves to `COMPLETED` with the most
   *   recent step output as its result (`null` when no step produced any)
   *   and its `activeKey` is released for reuse by a later run.
   * - **Next step is `APPROVAL`** — the run parks via
   *   {@link activateApprovalStep}.
   * - **Next step is `JOB`** — the run is claimed as `RUNNING` (including
   *   when it was parked in `AWAITING_APPROVAL`), then the step is activated
   *   via {@link activateJobStep} with a payload resolved from the run's
   *   definition: the definition step's `buildPayload` when declared,
   *   otherwise the most recent step output falling back to the run input.
   *
   * @param parameters - Guard, step outcome, and transaction.
   * @throws {@link WorkflowAdvanceError} When the run left
   *   {@link AdvancingRunStatuses} before the advance could finish, the next
   *   step cannot be activated, is missing from the registered definition, or
   *   its payload builder throws.
   * @throws {@link WorkflowDefinitionNotFoundError} When the run's definition
   *   is no longer registered.
   */
  async completeStepAndAdvance(parameters: CompleteStepAndAdvanceParameters): Promise<void> {
    const run = await this.workflowRunRepository.lockById(parameters.run.id, {
      transaction: parameters.transaction,
    })

    if (!run) {
      return
    }

    const step = run.steps.find((candidate) => candidate.id === parameters.step.id)

    if (!step || !parameters.guardStatuses.includes(step.status)) {
      return
    }

    const completedAt = new Date()
    const nextStep = run.steps.find((candidate) => candidate.position > step.position)
    const context = new WorkflowStepPayloadContextBuilder()
      .withInput(run.input)
      .addOutputsThroughStep(run, step, parameters.output)
      .build()

    const stepped = await this.workflowRunRepository.updateStepStatus(
      step.id,
      {
        completedAt,
        output: parameters.output,
        status: WorkflowStepStatus.COMPLETED,
      },
      {
        onlyIfStatusIn: parameters.guardStatuses,
        transaction: parameters.transaction,
      },
    )

    if (!stepped) {
      return
    }

    if (!nextStep) {
      await this.claimAdvanceableRunStatus(
        run.id,
        {
          activeKey: null,
          completedAt,
          result: context.latestOutput ?? null,
          status: WorkflowRunStatus.COMPLETED,
        },
        parameters.transaction,
      )
      return
    }

    if (nextStep.kind === WorkflowStepKind.APPROVAL) {
      await this.activateApprovalStep({ step: nextStep, transaction: parameters.transaction })
      return
    }

    await this.claimAdvanceableRunStatus(
      run.id,
      {
        status: WorkflowRunStatus.RUNNING,
      },
      parameters.transaction,
    )

    await this.activateJobStep({
      payload: this.resolveNextStepPayload(run, nextStep, context),
      step: nextStep,
      transaction: parameters.transaction,
    })
  }

  /**
   * Fails a step together with its run, terminally.
   *
   * Locks the run, reloads steps, then applies the guarded step failure.
   * When the step already left `guardStatuses`, the transition is a no-op.
   *
   * When the guard wins, the run moves to `FAILED` with the same `failedAt`
   * and the given failure payload, and its `activeKey` is released for reuse
   * by a later run. Both states are terminal; no further advance or approval
   * decision applies to the run afterwards.
   *
   * @param parameters - Guard, failure payload, step, run, and transaction.
   */
  async failStepAndRun(parameters: FailStepAndRunParameters): Promise<void> {
    const { failure, guardStatuses, transaction } = parameters
    const run = await this.workflowRunRepository.lockById(parameters.run.id, { transaction })

    if (!run) {
      return
    }

    if (!AdvancingRunStatuses.includes(run.status)) {
      return
    }

    const step = run.steps.find((candidate) => candidate.id === parameters.step.id)

    if (!step || !guardStatuses.includes(step.status)) {
      return
    }

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

    const failed = await this.workflowRunRepository.updateRunStatus(
      run.id,
      {
        activeKey: null,
        failedAt,
        failure,
        status: WorkflowRunStatus.FAILED,
      },
      {
        onlyIfStatusIn: AdvancingRunStatuses,
        transaction,
      },
    )

    if (!failed) {
      throw new WorkflowAdvanceError(
        run.id,
        `Workflow run ${run.id} is no longer RUNNING or AWAITING_APPROVAL and cannot fail`,
      )
    }
  }

  // MARK: - Private methods

  /**
   * Applies a run status write only while the run is still advanceable.
   *
   * @param runId - Primary key of the run to update.
   * @param parameters - Target status and optional terminal fields.
   * @param transaction - Open transaction the write joins.
   * @throws {@link WorkflowAdvanceError} When the run is no longer
   *   {@link AdvancingRunStatuses}.
   */
  private async claimAdvanceableRunStatus(
    runId: string,
    parameters: UpdateWorkflowRunStatusParameters,
    transaction: DatabaseTransaction,
  ): Promise<void> {
    const claimed = await this.workflowRunRepository.updateRunStatus(runId, parameters, {
      onlyIfStatusIn: AdvancingRunStatuses,
      transaction,
    })

    if (!claimed) {
      throw new WorkflowAdvanceError(
        runId,
        `Workflow run ${runId} is no longer RUNNING or AWAITING_APPROVAL and cannot advance`,
      )
    }
  }

  private resolveNextStepPayload(
    run: WorkflowRun,
    nextStep: WorkflowStep,
    context: WorkflowStepPayloadContext,
  ): unknown {
    const definition = this.definitionRegistry.resolve(run.definitionKey, run.definitionVersion)
    const stepDefinition = definition.steps.find((candidate) => candidate.key === nextStep.key)

    if (!stepDefinition) {
      throw new WorkflowAdvanceError(
        run.id,
        `Workflow run ${run.id} step ${nextStep.key} is not part of definition ${run.definitionKey}@${run.definitionVersion}`,
      )
    }

    try {
      return resolveWorkflowStepPayload(stepDefinition, context)
    } catch (error) {
      throw new WorkflowAdvanceError(
        run.id,
        `Workflow run ${run.id} could not build the payload for step ${nextStep.key}`,
        { cause: error },
      )
    }
  }
}
