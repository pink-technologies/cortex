// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import { WorkflowRunStatus, WorkflowStepStatus } from '../datatypes'
import { WorkflowRun } from '../models'
import { Database, Prisma } from '@/infraestructure/database'
import {
  WorkflowRunCreateError,
  WorkflowRunReadError,
  WorkflowRunUpdateError,
  WorkflowStepUpdateError,
} from '../error/error'

import type {
  CreateWorkflowRunParameters,
  UpdateWorkflowRunStatusParameters,
  UpdateWorkflowStepStatusParameters,
} from '../parameters'

/**
 * Injection token for the {@link WorkflowRunRepository} implementation.
 *
 * Register the concrete repository with this token in the workflow module and
 * inject it via `@Inject(WORKFLOW_RUN_REPOSITORY)`.
 */
export const WORKFLOW_RUN_REPOSITORY = Symbol('WORKFLOW_RUN_REPOSITORY')

/**
 * Persistence port for {@link WorkflowRun} rows and their steps.
 *
 * Implementations own mapping from create/update parameters onto Prisma models
 * (including JSON fields and uniqueness for `activeKey` / `triggerIdentifier`).
 */
export interface WorkflowRunRepository {
  /**
   * Inserts a workflow run and its steps atomically, then returns the run with
   * steps ordered by `position`.
   *
   * @param parameters - Run definition key, input, optional idempotency keys, and steps.
   * @returns The newly persisted {@link WorkflowRun}.
   * @throws {WorkflowRunCreateError} When persistence fails (including unique collisions).
   */
  create(parameters: CreateWorkflowRunParameters): Promise<WorkflowRun>

  /**
   * Loads a single run by primary key, including its steps.
   *
   * A missing row returns `null`. Persistence failures surface as
   * {@link WorkflowRunReadError}.
   *
   * @param id - Stable primary key of the workflow run.
   * @returns The domain run when found; otherwise `null`.
   * @throws {WorkflowRunReadError} When the persistence operation fails.
   */
  findById(id: string): Promise<WorkflowRun | null>

  /**
   * Updates a run's status and optional terminal fields.
   *
   * @param id - Primary key of the run to update.
   * @param parameters - Target status and optional result/failure/timestamps.
   * @returns `true` when one row was updated; `false` when the run does not exist.
   * @throws {WorkflowRunUpdateError} When the persistence operation fails.
   */
  updateRunStatus(id: string, parameters: UpdateWorkflowRunStatusParameters): Promise<boolean>

  /**
   * Updates a step's status and optional terminal fields.
   *
   * @param id - Primary key of the step to update.
   * @param parameters - Target status and optional output/timestamps.
   * @returns `true` when one row was updated; `false` when the step does not exist.
   * @throws {WorkflowStepUpdateError} When the persistence operation fails.
   */
  updateStepStatus(id: string, parameters: UpdateWorkflowStepStatusParameters): Promise<boolean>
}

/**
 * Prisma-backed implementation of {@link WorkflowRunRepository}.
 *
 * Registered under {@link WORKFLOW_RUN_REPOSITORY}. Consumers should depend on
 * the {@link WorkflowRunRepository} interface rather than this class.
 */
@Injectable()
export class WorkflowRunRepositoryImpl implements WorkflowRunRepository {
  // MARK: - Constructor

  /**
   * Creates a Prisma-backed workflow-run repository.
   *
   * @param database - Application database client used for persistence.
   */
  constructor(private readonly database: Database) {}

  // MARK: - WorkflowRunRepository

  /**
   * Inserts a workflow run and its steps atomically, then returns the run with
   * steps ordered by `position`.
   *
   * @param parameters - Run definition key, input, optional idempotency keys, and steps.
   * @returns The newly persisted {@link WorkflowRun}.
   * @throws {WorkflowRunCreateError} When persistence fails (including unique collisions).
   */
  async create(parameters: CreateWorkflowRunParameters): Promise<WorkflowRun> {
    try {
      const record = await this.database.workflowRun.create({
        data: {
          activeKey: parameters.activeKey,
          definitionKey: parameters.definitionKey,
          input: parameters.input as Prisma.InputJsonValue,
          status: WorkflowRunStatus.PENDING,
          steps: {
            create: parameters.steps.map((step) => ({
              input:
                step.input === undefined ? Prisma.DbNull : (step.input as Prisma.InputJsonValue),
              jobKind: step.jobKind,
              key: step.key,
              kind: step.kind,
              position: step.position,
              status: WorkflowStepStatus.PENDING,
            })),
          },
          triggerIdentifier: parameters.triggerIdentifier,
        },
        include: {
          steps: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      })

      return WorkflowRun.from(record)
    } catch (error) {
      throw new WorkflowRunCreateError('Failed to create workflow run', { cause: error })
    }
  }

  /**
   * Loads a single run by primary key, including its steps.
   *
   * @param id - Stable primary key of the workflow run.
   * @returns The domain run when found; otherwise `null`.
   * @throws {WorkflowRunReadError} When the persistence operation fails.
   */
  async findById(id: string): Promise<WorkflowRun | null> {
    try {
      const record = await this.database.workflowRun.findUnique({
        where: {
          id,
        },
        include: {
          steps: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      })

      if (!record) {
        return null
      }

      return WorkflowRun.from(record)
    } catch (error) {
      throw new WorkflowRunReadError('Failed to read workflow run', { cause: error })
    }
  }

  /**
   * Updates a run's status and optional terminal fields.
   *
   * @param id - Primary key of the run to update.
   * @param parameters - Target status and optional result/failure/timestamps.
   * @returns `true` when one row was updated; `false` when the run does not exist.
   * @throws {WorkflowRunUpdateError} When the persistence operation fails.
   */
  async updateRunStatus(id: string, parameters: UpdateWorkflowRunStatusParameters): Promise<boolean> {
    try {
      const data: Prisma.WorkflowRunUpdateManyMutationInput = {
        status: parameters.status,
      }

      if (parameters.startedAt !== undefined) {
        data.startedAt = parameters.startedAt
      }

      if (parameters.completedAt !== undefined) {
        data.completedAt = parameters.completedAt
      }

      if (parameters.failedAt !== undefined) {
        data.failedAt = parameters.failedAt
      }

      if (parameters.result !== undefined) {
        data.result =
          parameters.result === null ? Prisma.DbNull : (parameters.result as Prisma.InputJsonValue)
      }

      if (parameters.failure !== undefined) {
        data.failure =
          parameters.failure === null ? Prisma.DbNull : (parameters.failure as Prisma.InputJsonValue)
      }

      const result = await this.database.workflowRun.updateMany({
        where: {
          id,
        },
        data,
      })

      return result.count === 1
    } catch (error) {
      throw new WorkflowRunUpdateError('Failed to update workflow run status', { cause: error })
    }
  }

  /**
   * Updates a step's status and optional terminal fields.
   *
   * @param id - Primary key of the step to update.
   * @param parameters - Target status and optional output/timestamps.
   * @returns `true` when one row was updated; `false` when the step does not exist.
   * @throws {WorkflowStepUpdateError} When the persistence operation fails.
   */
  async updateStepStatus(
    id: string,
    parameters: UpdateWorkflowStepStatusParameters,
  ): Promise<boolean> {
    try {
      const data: Prisma.WorkflowStepUpdateManyMutationInput = {
        status: parameters.status,
      }

      if (parameters.startedAt !== undefined) {
        data.startedAt = parameters.startedAt
      }

      if (parameters.completedAt !== undefined) {
        data.completedAt = parameters.completedAt
      }

      if (parameters.failedAt !== undefined) {
        data.failedAt = parameters.failedAt
      }

      if (parameters.output !== undefined) {
        data.output =
          parameters.output === null ? Prisma.DbNull : (parameters.output as Prisma.InputJsonValue)
      }

      const result = await this.database.workflowStep.updateMany({
        where: {
          id,
        },
        data,
      })

      return result.count === 1
    } catch (error) {
      throw new WorkflowStepUpdateError('Failed to update workflow step status', { cause: error })
    }
  }
}
