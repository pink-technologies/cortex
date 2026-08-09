// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import { WorkflowRunStatus, WorkflowStepStatus } from '../datatypes'
import { WorkflowApprovalDecision, WorkflowRun } from '../models'
import { Database, Prisma, type DatabaseTransaction } from '@/infraestructure/database'
import type { CreateWorkflowRunResult } from '../models/create-workflow-run-result'
import type { WorkflowRunPage } from '../models/workflow-run-page'
import {
  WorkflowRunCreateError,
  WorkflowRunReadError,
  WorkflowRunUpdateError,
  WorkflowStepUpdateError,
} from '../error/error'

import type {
  CreateWorkflowApprovalDecisionParameters,
  CreateWorkflowRunParameters,
  FindWorkflowRunsParameters,
  RepositoryWriteOptions,
  RunRepositoryWriteOptions,
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
 * Shared Prisma include for loading a workflow run with its steps.
 *
 * Steps are ordered by `position` ascending so callers see activation order
 * without a separate sort.
 */
const workflowRunWithStepsInclude = {
  steps: {
    orderBy: {
      position: 'asc' as const,
    },
  },
} satisfies Prisma.WorkflowRunInclude

/**
 * Persistence port for {@link WorkflowRun} rows and their steps.
 *
 * Implementations own mapping from create/update parameters onto Prisma models
 * (including JSON fields and uniqueness for `activeKey` / `triggerIdentifier`).
 */
export interface WorkflowRunRepository {
  /**
   * Inserts a workflow run, or returns the existing row for the same
   * idempotency key.
   *
   * Lookup order: `triggerIdentifier`, then `activeKey`. When neither key is
   * set, always inserts. Concurrent inserts are race-safe: insert first, and
   * on a unique violation reload by those keys.
   *
   * @param parameters - Run definition key, input, optional idempotency keys, and steps.
   * @param options - Optional transaction client.
   * @returns Whether a row was inserted and the matching {@link WorkflowRun}.
   * @throws {WorkflowRunCreateError} When persistence fails for a non-idempotent reason.
   * @throws {WorkflowRunReadError} When a unique collision cannot be resolved to an existing run.
   */
  getOrCreate(
    parameters: CreateWorkflowRunParameters,
    options?: RepositoryWriteOptions,
  ): Promise<CreateWorkflowRunResult>

  /**
   * Loads a single run by primary key, including its steps.
   *
   * A missing row returns `null`. Persistence failures surface as
   * {@link WorkflowRunReadError}.
   *
   * @param id - Stable primary key of the workflow run.
   * @param options - Optional transaction client.
   * @returns The domain run when found; otherwise `null`.
   * @throws {WorkflowRunReadError} When the persistence operation fails.
   */
  findById(id: string, options?: RepositoryWriteOptions): Promise<WorkflowRun | null>

  /**
   * Loads a run by {@link CreateWorkflowRunParameters.triggerIdentifier}.
   *
   * @param triggerIdentifier - Enqueue idempotency key.
   * @param options - Optional transaction client.
   * @returns The domain run when found; otherwise `null`.
   * @throws {WorkflowRunReadError} When the persistence operation fails.
   */
  findByTriggerIdentifier(triggerIdentifier: string, options?: RepositoryWriteOptions): Promise<WorkflowRun | null>

  /**
   * Loads a run by {@link CreateWorkflowRunParameters.activeKey}.
   *
   * @param activeKey - Active-run uniqueness key.
   * @param options - Optional transaction client.
   * @returns The domain run when found; otherwise `null`.
   * @throws {WorkflowRunReadError} When the persistence operation fails.
   */
  findByActiveKey(activeKey: string, options?: RepositoryWriteOptions): Promise<WorkflowRun | null>

  /**
   * Lists a page of runs ordered by creation time descending, including steps.
   *
   * Optional status and definition-key filters combine with logical AND. The
   * page also reports the total match count so callers can compute page
   * boundaries.
   *
   * @param parameters - Filters and 1-based paging values.
   * @returns The matching page of runs with the total match count.
   * @throws {WorkflowRunReadError} When the persistence operation fails.
   */
  findMany(parameters: FindWorkflowRunsParameters): Promise<WorkflowRunPage>

  /**
   * Persists an approval decision audit row.
   *
   * {@link CreateWorkflowApprovalDecisionParameters.decisionId} is unique; a
   * collision surfaces as a Prisma unique-constraint error for the caller to
   * treat as an idempotent retry or conflict.
   *
   * @param parameters - Decision identity, outcome, actor, and optional reason.
   * @param options - Optional transaction client.
   * @returns The persisted domain decision.
   * @throws {WorkflowRunCreateError} When persistence fails.
   */
  createApprovalDecision(
    parameters: CreateWorkflowApprovalDecisionParameters,
    options?: RepositoryWriteOptions,
  ): Promise<WorkflowApprovalDecision>

  /**
   * Loads an approval decision by client idempotency key.
   *
   * @param decisionId - Client-supplied decision idempotency key.
   * @param options - Optional transaction client.
   * @returns The domain decision when found; otherwise `null`.
   * @throws {WorkflowRunReadError} When the persistence operation fails.
   */
  findApprovalDecisionByDecisionId(
    decisionId: string,
    options?: RepositoryWriteOptions,
  ): Promise<WorkflowApprovalDecision | null>

  /**
   * Locks a run row for update and reloads it with ordered steps.
   *
   * Callers must hold an open transaction. Acquiring the run lock before any
   * step or job writes keeps cancel/advance/approval on one lock order and
   * avoids deadlocks.
   *
   * @param id - Stable primary key of the workflow run.
   * @param options - Transaction that will own the row lock.
   * @returns The locked domain run when found; otherwise `null`.
   * @throws {WorkflowRunReadError} When the persistence operation fails.
   */
  lockById(
    id: string,
    options: {
      readonly transaction: DatabaseTransaction
    },
  ): Promise<WorkflowRun | null>

  /**
   * Updates a run's status and optional terminal fields.
   *
   * @param id - Primary key of the run to update.
   * @param parameters - Target status and optional result/failure/timestamps.
   * @param options - Optional transaction client and status guard.
   * @returns `true` when one row was updated; `false` when the run does not
   *   exist or fails the status guard.
   * @throws {WorkflowRunUpdateError} When the persistence operation fails.
   */
  updateRunStatus(
    id: string,
    parameters: UpdateWorkflowRunStatusParameters,
    options?: RunRepositoryWriteOptions,
  ): Promise<boolean>

  /**
   * Updates a step's status and optional terminal fields.
   *
   * @param id - Primary key of the step to update.
   * @param parameters - Target status and optional output/timestamps.
   * @param options - Optional transaction client and status guard.
   * @returns `true` when one row was updated; `false` when no row matched.
   * @throws {WorkflowStepUpdateError} When the persistence operation fails.
   */
  updateStepStatus(
    id: string,
    parameters: UpdateWorkflowStepStatusParameters,
    options?: RepositoryWriteOptions,
  ): Promise<boolean>
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
   * Inserts a workflow run, or returns the existing row for the same
   * idempotency key.
   *
   * @param parameters - Run definition key, input, optional idempotency keys, and steps.
   * @param options - Optional transaction client.
   * @returns Whether a row was inserted and the matching {@link WorkflowRun}.
   * @throws {WorkflowRunCreateError} When persistence fails for a non-idempotent reason.
   * @throws {WorkflowRunReadError} When a unique collision cannot be resolved to an existing run.
   */
  async getOrCreate(
    parameters: CreateWorkflowRunParameters,
    options?: RepositoryWriteOptions,
  ): Promise<CreateWorkflowRunResult> {
    const existing = await this.findByIdempotencyKeys(parameters, options)

    if (existing) {
      return {
        created: false,
        run: existing,
      }
    }

    try {
      const client = options?.transaction ?? this.database
      const record = await client.workflowRun.create({
        data: {
          activeKey: parameters.activeKey,
          definitionKey: parameters.definitionKey,
          definitionVersion: parameters.definitionVersion,
          input: parameters.input as Prisma.InputJsonValue,
          status: WorkflowRunStatus.PENDING,
          triggerIdentifier: parameters.triggerIdentifier,
          steps: {
            create: parameters.steps.map((step) => ({
              input: step.input === undefined ? Prisma.DbNull : (step.input as Prisma.InputJsonValue),
              jobKind: step.jobKind,
              key: step.key,
              kind: step.kind,
              position: step.position,
              status: WorkflowStepStatus.PENDING,
            })),
          },
        },
        include: workflowRunWithStepsInclude,
      })

      return {
        created: true,
        run: WorkflowRun.from(record),
      }
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) {
        throw new WorkflowRunCreateError('Failed to create workflow run', { cause: error })
      }

      const raced = await this.findByIdempotencyKeys(parameters, options)

      if (raced) {
        return {
          created: false,
          run: raced,
        }
      }

      throw new WorkflowRunReadError('Failed to resolve workflow run after unique conflict', {
        cause: error,
      })
    }
  }

  /**
   * Loads a single run by primary key, including its steps.
   *
   * @param id - Stable primary key of the workflow run.
   * @param options - Optional transaction client.
   * @returns The domain run when found; otherwise `null`.
   * @throws {WorkflowRunReadError} When the persistence operation fails.
   */
  async findById(id: string, options?: RepositoryWriteOptions): Promise<WorkflowRun | null> {
    try {
      const client = options?.transaction ?? this.database
      const record = await client.workflowRun.findUnique({
        where: {
          id,
        },
        include: workflowRunWithStepsInclude,
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
   * Loads a run by enqueue idempotency key.
   *
   * @param triggerIdentifier - Enqueue idempotency key.
   * @param options - Optional transaction client.
   * @returns The domain run when found; otherwise `null`.
   * @throws {WorkflowRunReadError} When the persistence operation fails.
   */
  async findByTriggerIdentifier(
    triggerIdentifier: string,
    options?: RepositoryWriteOptions,
  ): Promise<WorkflowRun | null> {
    try {
      const client = options?.transaction ?? this.database
      const record = await client.workflowRun.findUnique({
        include: workflowRunWithStepsInclude,
        where: {
          triggerIdentifier,
        },
      })

      if (!record) {
        return null
      }

      return WorkflowRun.from(record)
    } catch (error) {
      throw new WorkflowRunReadError('Failed to read workflow run by trigger identifier', {
        cause: error,
      })
    }
  }

  /**
   * Loads a run by active-run uniqueness key.
   *
   * @param activeKey - Active-run uniqueness key.
   * @param options - Optional transaction client.
   * @returns The domain run when found; otherwise `null`.
   * @throws {WorkflowRunReadError} When the persistence operation fails.
   */
  async findByActiveKey(activeKey: string, options?: RepositoryWriteOptions): Promise<WorkflowRun | null> {
    try {
      const client = options?.transaction ?? this.database
      const record = await client.workflowRun.findUnique({
        where: {
          activeKey,
        },
        include: workflowRunWithStepsInclude,
      })

      if (!record) {
        return null
      }

      return WorkflowRun.from(record)
    } catch (error) {
      throw new WorkflowRunReadError('Failed to read workflow run by active key', { cause: error })
    }
  }

  /**
   * Lists a page of runs ordered by creation time descending, including steps.
   *
   * @param parameters - Filters and 1-based paging values.
   * @returns The matching page of runs with the total match count.
   * @throws {WorkflowRunReadError} When the persistence operation fails.
   */
  async findMany(parameters: FindWorkflowRunsParameters): Promise<WorkflowRunPage> {
    try {
      const where: Prisma.WorkflowRunWhereInput = {
        ...(parameters.definitionKey ? { definitionKey: parameters.definitionKey } : {}),
        ...(parameters.status ? { status: parameters.status } : {}),
      }

      const [total, records] = await Promise.all([
        this.database.workflowRun.count({ where }),
        this.database.workflowRun.findMany({
          where,
          include: {
            steps: {
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: Math.max(0, (parameters.page - 1) * parameters.limit),
          take: parameters.limit,
        }),
      ])

      return {
        items: records.map(WorkflowRun.from),
        total,
      }
    } catch (error) {
      throw new WorkflowRunReadError('Failed to list workflow runs', { cause: error })
    }
  }

  /**
   * Persists an approval decision audit row.
   *
   * @param parameters - Decision identity, outcome, actor, and optional reason.
   * @param options - Optional transaction client.
   * @returns The persisted domain decision.
   * @throws {WorkflowRunCreateError} When persistence fails.
   */
  async createApprovalDecision(
    parameters: CreateWorkflowApprovalDecisionParameters,
    options?: RepositoryWriteOptions,
  ): Promise<WorkflowApprovalDecision> {
    try {
      const client = options?.transaction ?? this.database
      const record = await client.workflowApprovalDecision.create({
        data: {
          actorId: parameters.actorId,
          decisionId: parameters.decisionId,
          outcome: parameters.outcome,
          reason: parameters.reason,
          runId: parameters.runId,
          stepId: parameters.stepId,
        },
      })

      return WorkflowApprovalDecision.from(record)
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw error
      }

      throw new WorkflowRunCreateError('Failed to create workflow approval decision', { cause: error })
    }
  }

  /**
   * Loads an approval decision by client idempotency key.
   *
   * @param decisionId - Client-supplied decision idempotency key.
   * @param options - Optional transaction client.
   * @returns The domain decision when found; otherwise `null`.
   * @throws {WorkflowRunReadError} When the persistence operation fails.
   */
  async findApprovalDecisionByDecisionId(
    decisionId: string,
    options?: RepositoryWriteOptions,
  ): Promise<WorkflowApprovalDecision | null> {
    try {
      const client = options?.transaction ?? this.database
      const record = await client.workflowApprovalDecision.findUnique({
        where: {
          decisionId,
        },
      })

      if (!record) {
        return null
      }

      return WorkflowApprovalDecision.from(record)
    } catch (error) {
      throw new WorkflowRunReadError('Failed to read workflow approval decision', { cause: error })
    }
  }

  /**
   * Locks a run row for update and reloads it with ordered steps.
   *
   * @param id - Stable primary key of the workflow run.
   * @param options - Transaction that will own the row lock.
   * @returns The locked domain run when found; otherwise `null`.
   * @throws {WorkflowRunReadError} When the persistence operation fails.
   */
  async lockById(
    id: string,
    options: {
      readonly transaction: DatabaseTransaction
    },
  ): Promise<WorkflowRun | null> {
    try {
      const locked = await options.transaction.$queryRaw<{ id: string }[]>`
        SELECT id FROM workflow_run WHERE id = ${id} FOR UPDATE
      `

      if (locked.length === 0) {
        return null
      }

      return this.findById(id, { transaction: options.transaction })
    } catch (error) {
      throw new WorkflowRunReadError('Failed to lock workflow run', { cause: error })
    }
  }

  /**
   * Updates a run's status and optional terminal fields.
   *
   * @param id - Primary key of the run to update.
   * @param parameters - Target status and optional result/failure/timestamps.
   * @param options - Optional transaction client and status guard.
   * @returns `true` when one row was updated; `false` when the run does not
   *   exist or fails the status guard.
   * @throws {WorkflowRunUpdateError} When the persistence operation fails.
   */
  async updateRunStatus(
    id: string,
    parameters: UpdateWorkflowRunStatusParameters,
    options?: RunRepositoryWriteOptions,
  ): Promise<boolean> {
    try {
      const client = options?.transaction ?? this.database
      const data: Prisma.WorkflowRunUpdateManyMutationInput = {
        status: parameters.status,
      }

      if (parameters.activeKey !== undefined) {
        data.activeKey = parameters.activeKey
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
        data.result = parameters.result === null ? Prisma.DbNull : (parameters.result as Prisma.InputJsonValue)
      }

      if (parameters.failure !== undefined) {
        data.failure = parameters.failure === null ? Prisma.DbNull : (parameters.failure as Prisma.InputJsonValue)
      }

      const result = await client.workflowRun.updateMany({
        data,
        where: {
          id,
          ...(options?.onlyIfStatusIn
            ? {
                status: {
                  in: [...options.onlyIfStatusIn],
                },
              }
            : {}),
        },
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
   * @param options - Optional transaction client and status guard.
   * @returns `true` when one row was updated; `false` when no row matched.
   * @throws {WorkflowStepUpdateError} When the persistence operation fails.
   */
  async updateStepStatus(
    id: string,
    parameters: UpdateWorkflowStepStatusParameters,
    options?: RepositoryWriteOptions,
  ): Promise<boolean> {
    try {
      const client = options?.transaction ?? this.database
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
        data.output = parameters.output === null ? Prisma.DbNull : (parameters.output as Prisma.InputJsonValue)
      }

      const result = await client.workflowStep.updateMany({
        data,
        where: {
          id,
          ...(options?.onlyIfStatusIn
            ? {
                status: {
                  in: [...options.onlyIfStatusIn],
                },
              }
            : {}),
        },
      })

      return result.count === 1
    } catch (error) {
      throw new WorkflowStepUpdateError('Failed to update workflow step status', { cause: error })
    }
  }

  // MARK: - Private methods

  private async findByIdempotencyKeys(
    parameters: CreateWorkflowRunParameters,
    options?: RepositoryWriteOptions,
  ): Promise<WorkflowRun | null> {
    if (parameters.triggerIdentifier) {
      const byTrigger = await this.findByTriggerIdentifier(parameters.triggerIdentifier, options)

      if (byTrigger) {
        return byTrigger
      }
    }

    if (parameters.activeKey) {
      return this.findByActiveKey(parameters.activeKey, options)
    }

    return null
  }
}

/**
 * Returns whether Prisma reported a unique-constraint violation.
 *
 * Used by {@link WorkflowRunRepositoryImpl.getOrCreate} and approval-decision
 * inserts to distinguish an idempotent collision (`P2002`) from other failures.
 */
export function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}
