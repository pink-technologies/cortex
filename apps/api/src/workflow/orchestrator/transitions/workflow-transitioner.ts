// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { forwardRef, Inject, Injectable } from '@nestjs/common'
import type { DatabaseTransaction } from '@/infraestructure/database'
import { ExecutionJobService } from '../../../execution/execution-job.service'
import type { ExecutionJob } from '../../../execution/models/execution-job'
import type { ExecutionJobSource } from '../../../execution/models/execution-job-source'
import { WorkflowRunStatus, WorkflowStepKind, WorkflowStepStatus } from '../../datatypes'
import type { WorkflowStepPayloadContext } from '../../definitions/models'
import { resolveWorkflowStepPayload } from '../../definitions/payload'
import { WorkflowDefinitionRegistry } from '../../definitions/registry'
import { WorkflowAdvanceError } from '../../error/error'
import type { WorkflowRun } from '../../models/workflow-run'
import type { WorkflowStep } from '../../models/workflow-step'
import { WORKFLOW_RUN_REPOSITORY, type WorkflowRunRepository } from '../../repository'

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
   * payload building, the `definitionKey` resolved for `buildPayload` lookups,
   * the `input` used as the payload fallback, and the `status` that decides
   * whether a resume write back to `RUNNING` is needed.
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
   * - **No step remains** — the run moves to `COMPLETED` with the most
   *   recent step output as its result (`null` when no step produced any)
   *   and its `activeKey` is released for reuse by a later run.
   * - **Next step is `APPROVAL`** — the run parks via
   *   {@link activateApprovalStep}.
   * - **Next step is `JOB`** — the step is activated via
   *   {@link activateJobStep} with a payload resolved from the run's
   *   definition: the definition step's `buildPayload` when declared,
   *   otherwise the most recent step output falling back to the run input.
   *   When the run was parked (for example resuming from an approval), it is
   *   first moved back to `RUNNING`.
   *
   * @param parameters - Guard, step outcome, and transaction.
   * @throws {@link WorkflowAdvanceError} When the next step cannot be
   *   activated, is missing from the registered definition, or its payload
   *   builder throws.
   * @throws {@link WorkflowDefinitionNotFoundError} When the run's definition
   *   is no longer registered.
   */
  async completeStepAndAdvance(parameters: CompleteStepAndAdvanceParameters): Promise<void> {
    const completedAt = new Date()
    const nextStep = parameters.run.steps.find((candidate) => candidate.position > parameters.step.position)
    const context = this.buildPayloadContext(parameters.run, parameters.step, parameters.output)
    const stepped = await this.workflowRunRepository.updateStepStatus(
      parameters.step.id,
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
      await this.workflowRunRepository.updateRunStatus(
        parameters.run.id,
        {
          activeKey: null,
          completedAt,
          result: context.latestOutput ?? null,
          status: WorkflowRunStatus.COMPLETED,
        },
        { transaction: parameters.transaction },
      )
      return
    }

    if (nextStep.kind === WorkflowStepKind.APPROVAL) {
      await this.activateApprovalStep({ step: nextStep, transaction: parameters.transaction })
      return
    }

    if (parameters.run.status !== WorkflowRunStatus.RUNNING) {
      await this.workflowRunRepository.updateRunStatus(
        parameters.run.id,
        {
          status: WorkflowRunStatus.RUNNING,
        },
        { transaction: parameters.transaction },
      )
    }

    await this.activateJobStep({
      payload: this.resolveNextStepPayload(parameters.run, nextStep, context),
      step: nextStep,
      transaction: parameters.transaction,
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

  // MARK: - Private methods

  private buildPayloadContext(
    run: WorkflowRun,
    completingStep: WorkflowStep,
    output: unknown,
  ): WorkflowStepPayloadContext {
    const outputs: Record<string, unknown> = {}
    let latestOutput: unknown

    const orderedSteps = [...run.steps].sort((left, right) => left.position - right.position)

    for (const candidate of orderedSteps) {
      if (candidate.position > completingStep.position) {
        continue
      }

      const candidateOutput = candidate.id === completingStep.id ? output : candidate.output

      if (candidateOutput != null) {
        outputs[candidate.key] = candidateOutput
        latestOutput = candidateOutput
      }
    }

    return {
      input: run.input,
      latestOutput,
      outputs,
    }
  }

  private resolveNextStepPayload(
    run: WorkflowRun,
    nextStep: WorkflowStep,
    context: WorkflowStepPayloadContext,
  ): unknown {
    const definition = this.definitionRegistry.resolve(run.definitionKey)
    const stepDefinition = definition.steps.find((candidate) => candidate.key === nextStep.key)

    if (!stepDefinition) {
      throw new WorkflowAdvanceError(
        run.id,
        `Workflow run ${run.id} step ${nextStep.key} is not part of definition ${run.definitionKey}`,
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
