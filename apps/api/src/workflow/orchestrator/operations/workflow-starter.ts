// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { Database } from '@/infraestructure/database'
import {
  EXECUTION_JOB_REPOSITORY,
  type ExecutionJobRepository,
} from '@/execution/execution-job-repository'
import { WorkflowRunStatus, WorkflowStepKind } from '../../datatypes'
import { resolveWorkflowStepPayload, WorkflowStepPayloadContextBuilder } from '../../definitions/payload'
import { WorkflowDefinitionRegistry } from '../../definitions/registry'
import { WorkflowStartError } from '../../error/error'
import { WorkflowTransitioner } from '../transitions'
import type { StartWorkflowRunResult } from '../../models/start-workflow-run-result'
import type { StartWorkflowRunParameters } from '../../parameters'
import { WORKFLOW_RUN_REPOSITORY, type WorkflowRunRepository } from '../../repository'

/**
 * Starts workflow runs against registered definitions.
 *
 * Owns the start flow only: resolving the definition, persisting the run with
 * all steps `PENDING`, and activating the first `JOB` step in one
 * transaction. Advancing and approval decisions live in their own
 * collaborators behind {@link WorkflowOrchestrator}.
 *
 * When `triggerIdentifier` or `activeKey` already owns a run, start returns
 * that run and its first-step job without activating again (`created: false`).
 * Payload builders run only after a new run is confirmed created.
 */
@Injectable()
export class WorkflowStarter {
  // MARK: - Constructor

  /**
   * Creates a workflow starter.
   *
   * @param database - Database client used for the start transaction.
   * @param definitionRegistry - Registry used to resolve definition keys.
   * @param executionJobRepository - Persistence port used to load an existing first-step job.
   * @param transitioner - Transition writer used to activate the first step.
   * @param workflowRunRepository - Persistence port for runs and steps.
   */
  constructor(
    private readonly database: Database,
    private readonly definitionRegistry: WorkflowDefinitionRegistry,
    @Inject(EXECUTION_JOB_REPOSITORY)
    private readonly executionJobRepository: ExecutionJobRepository,
    private readonly transitioner: WorkflowTransitioner,
    @Inject(WORKFLOW_RUN_REPOSITORY)
    private readonly workflowRunRepository: WorkflowRunRepository,
  ) {}

  // MARK: - Instance methods

  /**
   * Starts a workflow run for the given definition key.
   *
   * Creates the run and all definition steps in `PENDING`, then activates the
   * first step when it is a `JOB`: enqueues a child execution job whose
   * payload is the definition step's `buildPayload` result (the run input
   * when no builder is declared), marks the step `QUEUED`, and marks the run
   * `RUNNING`. Those writes run in a single transaction.
   *
   * Idempotency keys (`triggerIdentifier`, `activeKey`) are owned by the run.
   * Matching keys return the existing run and first-step job without a second
   * activation and without invoking payload builders.
   *
   * @param parameters - Definition key, input, and optional run idempotency keys.
   * @returns The activated (or existing) run, first-step child job, and whether
   *   a new run was created.
   * @throws {@link WorkflowDefinitionNotFoundError} When the definition key is unknown.
   * @throws {@link WorkflowStartError} When the first step is not an activatable
   *   `JOB`, its payload builder rejects the input, or an existing run is
   *   missing its first-step job.
   * @throws {@link WorkflowRunCreateError} When run persistence fails for a
   *   non-idempotent reason.
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
      const { created, run } = await this.workflowRunRepository.getOrCreate(
        {
          activeKey: parameters.activeKey,
          definitionKey: definition.key,
          definitionVersion: definition.version,
          input: parameters.input,
          steps,
          triggerIdentifier: parameters.triggerIdentifier,
        },
        { transaction },
      )

      const firstStep = run.steps.find((step) => step.key === firstStepDefinition.key)

      if (!firstStep) {
        throw new WorkflowStartError(
          definition.key,
          `Workflow run ${run.id} is missing first step ${firstStepDefinition.key}`,
        )
      }

      if (!created) {
        const job = await this.executionJobRepository.findByStepId(firstStep.id, { transaction })

        if (!job) {
          throw new WorkflowStartError(
            definition.key,
            `Workflow run ${run.id} is missing the execution job for first step ${firstStepDefinition.key}`,
          )
        }

        return {
          created: false,
          job,
          run,
        }
      }

      let firstStepPayload: unknown

      try {
        firstStepPayload = resolveWorkflowStepPayload(
          firstStepDefinition,
          new WorkflowStepPayloadContextBuilder().withInput(run.input).build(),
        )
      } catch (error) {
        throw new WorkflowStartError(
          definition.key,
          `Workflow definition ${definition.key} could not build the payload for first step ${firstStepDefinition.key}`,
          { cause: error },
        )
      }

      const job = await this.transitioner.activateJobStep({
        payload: firstStepPayload,
        priority: parameters.priority,
        source: parameters.source,
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
        created: true,
        job,
        run: activatedRun,
      }
    })
  }
}
