// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { Database, type DatabaseTransaction } from '@/infraestructure/database'
import { ExecutionJobService } from '../../execution/execution-job.service'
import type { ExecutionJob } from '../../execution/models/execution-job'
import { WorkflowRunStatus, WorkflowStepKind, WorkflowStepStatus } from '../datatypes'
import { WorkflowDefinitionRegistry } from '../definitions/registry'
import { WorkflowAdvanceError, WorkflowStartError } from '../error/error'
import type { StartWorkflowRunResult } from '../models/start-workflow-run-result'
import type { WorkflowRun } from '../models/workflow-run'
import type { WorkflowStep } from '../models/workflow-step'
import type { StartWorkflowRunParameters } from '../parameters/start-workflow-run-parameters'
import { WORKFLOW_RUN_REPOSITORY, type WorkflowRunRepository } from '../repository'

/**
 * Resolved workflow context for a terminal child job.
 *
 * Produced by the orchestrator's linked-step lookup when the job belongs to a
 * run and its step is still active.
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
 * Starts and advances workflow runs against registered definitions.
 *
 * {@link start} creates the run and activates the first `JOB` step.
 * {@link onJobCompleted} / {@link onJobFailed} advance or fail the run after a
 * child execution job reaches a terminal state. Approval activation is Chunk 6;
 * when the next step is `APPROVAL`, the completed `JOB` step is left terminal
 * and the approval step stays `PENDING`.
 *
 * Start, advance, and fail apply workflow mutations inside
 * {@link Database.withTransaction} so run/step status and child job enqueue
 * commit atomically. On job terminal, complete/fail is persisted first by
 * {@link ExecutionJobService}; that advance/fail transaction covers the
 * workflow half only.
 */
@Injectable()
export class WorkflowOrchestrator {
  // MARK: - Constructor

  /**
   * Creates a workflow orchestrator.
   *
   * @param database - Database client used for advance/fail transactions.
   * @param definitionRegistry - Registry used to resolve definition keys.
   * @param executionJobService - Service used to enqueue child execution jobs.
   * @param workflowRunRepository - Persistence port for runs and steps.
   */
  constructor(
    private readonly database: Database,
    private readonly definitionRegistry: WorkflowDefinitionRegistry,
    @Inject(forwardRef(() => ExecutionJobService))
    private readonly executionJobService: ExecutionJobService,
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
   * parks when the next step is `APPROVAL` (until Chunk 6).
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
    const completedAt = new Date()
    const nextStep = run.steps.find((candidate) => candidate.position > step.position)
    const payload = job.result ?? run.input

    await this.database.withTransaction(async (transaction) => {
      const parameters = {
        completedAt,
        output: job.result,
        status: WorkflowStepStatus.COMPLETED,
      }

      const stepped = await this.workflowRunRepository.updateStepStatus(step.id, parameters, {
        onlyIfStatusIn: [WorkflowStepStatus.QUEUED, WorkflowStepStatus.RUNNING],
        transaction,
      })

      if (!stepped) {
        return
      }

      if (!nextStep) {
        const parameters = {
          completedAt,
          result: job.result,
          status: WorkflowRunStatus.COMPLETED,
        }

        await this.workflowRunRepository.updateRunStatus(run.id, parameters, { transaction })
        return
      }

      if (nextStep.kind === WorkflowStepKind.APPROVAL) {
        // Chunk 6 activates APPROVAL. Until then the run stays RUNNING with the
        // approval step PENDING.
        return
      }

      await this.activateJobStep({
        payload,
        step: nextStep,
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
    const failedAt = new Date()

    await this.database.withTransaction(async (transaction) => {
      const stepped = await this.workflowRunRepository.updateStepStatus(
        step.id,
        {
          failedAt,
          status: WorkflowStepStatus.FAILED,
        },
        {
          onlyIfStatusIn: [WorkflowStepStatus.QUEUED, WorkflowStepStatus.RUNNING],
          transaction,
        },
      )

      if (!stepped) {
        return
      }

      await this.workflowRunRepository.updateRunStatus(
        run.id,
        {
          failedAt,
          failure: job.failure,
          status: WorkflowRunStatus.FAILED,
        },
        { transaction },
      )
    })
  }

  /**
   * Starts a workflow run for the given definition key.
   *
   * Creates the run and all definition steps in `PENDING`, then activates the
   * first step when it is a `JOB`: enqueues a child execution job whose payload
   * is the run input, marks the step `QUEUED`, and marks the run `RUNNING`.
   * Those writes run in a single transaction.
   *
   * Idempotency keys (`triggerIdentifier`, `activeKey`) are stored on the run.
   * Child jobs do not reuse those keys until uniqueness moves fully to runs.
   *
   * @param parameters - Definition key, input, and optional run idempotency keys.
   * @returns The activated run and the first-step child job.
   * @throws {@link WorkflowDefinitionNotFoundError} When the definition key is unknown.
   * @throws {@link WorkflowStartError} When the first step is not an activatable `JOB`.
   * @throws {@link WorkflowRunCreateError} When run persistence fails (including unique collisions).
   */
  async start(parameters: StartWorkflowRunParameters): Promise<StartWorkflowRunResult> {
    const definition = this.definitionRegistry.resolve(parameters.definitionKey)
    const firstStepDefinition = definition.steps[0]

    if (!firstStepDefinition) {
      throw new WorkflowStartError(definition.key, `Workflow definition ${definition.key} has no steps`)
    }

    if (firstStepDefinition.kind !== WorkflowStepKind.JOB || firstStepDefinition.jobKind == null) {
      throw new WorkflowStartError(
        definition.key,
        `Workflow definition ${definition.key} first step must be a JOB with jobKind`,
      )
    }

    const steps = definition.steps.map((step) => ({
      jobKind: step.jobKind,
      key: step.key,
      kind: step.kind,
      position: step.position,
    }))

    return this.database.withTransaction(async (transaction) => {
      const createWorkflowRunParameters = {
        activeKey: parameters.activeKey,
        definitionKey: definition.key,
        input: parameters.input,
        steps,
        triggerIdentifier: parameters.triggerIdentifier,
      }

      const run = await this.workflowRunRepository.create(createWorkflowRunParameters, { transaction })
      const firstStep = run.steps.find((step) => step.key === firstStepDefinition.key)

      if (!firstStep) {
        throw new WorkflowStartError(
          definition.key,
          `Workflow run ${run.id} is missing first step ${firstStepDefinition.key}`,
        )
      }

      const job = await this.activateJobStep({
        payload: parameters.input,
        priority: parameters.priority,
        step: firstStep,
        transaction,
      })

      await this.workflowRunRepository.updateRunStatus(
        run.id,
        {
          startedAt: new Date(),
          status: WorkflowRunStatus.RUNNING,
        },
        { transaction },
      )

      const activatedRun = await this.workflowRunRepository.findById(run.id, { transaction })

      if (!activatedRun) {
        throw new Error(`Invariant violated: workflow run ${run.id} missing after start writes`)
      }

      return {
        job,
        run: activatedRun,
      }
    })
  }

  // MARK: - Private methods

  private async activateJobStep(parameters: {
    payload: unknown
    priority?: number
    step: WorkflowStep
    transaction: DatabaseTransaction
  }): Promise<ExecutionJob> {
    const { payload, priority = 0, step, transaction } = parameters

    if (step.kind !== WorkflowStepKind.JOB || step.jobKind == null) {
      throw new WorkflowAdvanceError(step.runId, `Workflow step ${step.key} must be a JOB with jobKind to activate`)
    }

    const createExecutionJobParameters = {
      kind: step.jobKind,
      payload,
      payloadVersion: 1,
      policy: {},
      priority,
      runId: step.runId,
      stepId: step.id,
      requirements: {
        allOf: [],
      },
    }

    const job = await this.executionJobService.create(createExecutionJobParameters, { transaction })
    
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
