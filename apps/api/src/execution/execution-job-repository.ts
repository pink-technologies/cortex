// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { CompleteExecutionJobRequest, FailExecutionJobRequest } from '@cortex/protocol'
import { Database, ExecutionJobStatus, Prisma, type DatabaseTransaction } from '@/infraestructure/database'
import type { ClaimExecutionJobParameters, CreateExecutionJobParameters } from './parameters'
import { ExecutionJob, ExecutionJobPolicySchema, ExecutionJobRequirements, ExecutionJobRequirementsSchema } from './models'

/**
 * Injection token for the {@link ExecutionJobRepository} implementation.
 *
 * Register the concrete repository with this token in the execution module and
 * inject it via `@Inject(EXECUTION_JOB_REPOSITORY)`.
 */
export const EXECUTION_JOB_REPOSITORY = Symbol('EXECUTION_JOB_REPOSITORY')

/**
 * Persistence port for {@link ExecutionJob} rows.
 *
 * Implementations own mapping from {@link CreateExecutionJobParameters} onto the
 * Prisma model (including JSON fields). Callers should not talk to Prisma
 * directly for job CRUD.
 */
export interface ExecutionJobRepository {
  /**
   * Atomically claims the next ready queued job that this worker can run.
   *
   * Selects candidates with `status = QUEUED`, `availableAt <= now`, and
   * `kind` in {@link ClaimExecutionJobParameters.supportedKinds}, ordered by
   * `priority` descending then `createdAt` ascending. Each candidate’s
   * `requirements` are matched against the worker’s capabilities and labels;
   * the first successful optimistic update (`QUEUED` → `RUNNING`) wins.
   *
   * Concurrent claimants are safe: `updateMany` gated on `QUEUED` ensures only
   * one worker transitions a given row. Unclaimed races simply try the next
   * candidate.
   *
   * @param parameters - Worker identity, supported kinds, and matching metadata.
   * @returns The claimed job now in `RUNNING`, or `null` if none were eligible
   *   or all candidates were claimed by others first.
   */
  claimNextAvailable(parameters: ClaimExecutionJobParameters): Promise<ExecutionJob | null>

  /**
   * Marks a running job as successfully completed.
   *
   * The transition is conditional (`RUNNING` → `COMPLETED`).
   *
   * @param id - Primary key of the job to complete.
   * @param request - Request to complete the job.
   * @returns `true` when one running job was transitioned; `false` when the
   *   job does not exist or is no longer `RUNNING`.
   */
  complete(id: string, request: CompleteExecutionJobRequest): Promise<boolean>

  /**
   * Inserts a new job in `QUEUED` (or equivalent ready) state and returns the
   * persisted row.
   *
   * @param parameters - Enqueue parameters (kind, payload, policy, requirements, etc.).
   * @param options - Optional transaction client.
   * @returns The created {@link ExecutionJob}, including generated `id` and timestamps.
   */
  create(
    parameters: CreateExecutionJobParameters,
    options?: { transaction?: DatabaseTransaction },
  ): Promise<ExecutionJob>

  /**
   * Marks a running job as failed.
   *
   * The transition is conditional (`RUNNING` → `FAILED`).
   *
   * @param id - Primary key of the job to fail.
   * @param request - Request to fail the job.
   * @returns `true` when one running job was transitioned; `false` when the
   *   job does not exist or is no longer `RUNNING`.
   */
  fail(id: string, request: FailExecutionJobRequest): Promise<boolean>

  /**
   * Loads a single job by primary key.
   *
   * Performs a point lookup with no status filter, so queued, running, and
   * terminal jobs are all returned when present. The Prisma row is mapped to
   * a domain {@link ExecutionJob} via {@link ExecutionJob.from}, including
   * JSON fields such as `payload`, `result`, and `failure`.
   *
   * A missing row is an expected outcome and returns `null`; it is not an
   * error. Persistence failures propagate to the caller.
   *
   * @param id - Stable primary key of the execution job (`ExecutionJob.id`).
   * @param options - Optional transaction client.
   * @returns The domain job when found; otherwise `null`.
   */
  findById(id: string, options?: { transaction?: DatabaseTransaction }): Promise<ExecutionJob | null>

  /**
   * Loads the earliest job linked to a workflow step.
   *
   * Used when an idempotent workflow start reuses an existing run and needs
   * the first-step child job without activating again.
   *
   * @param stepId - Owning workflow step primary key.
   * @param options - Optional transaction client.
   * @returns The domain job when found; otherwise `null`.
   */
  findByStepId(
    stepId: string,
    options?: { transaction?: DatabaseTransaction },
  ): Promise<ExecutionJob | null>

  /**
   * Returns a page of jobs ordered by `createdAt` descending (newest first).
   *
   * Uses 1-based {@link page}: `skip = (page - 1) * limit`. Does not filter by
   * status or kind — add dedicated query methods when those are needed.
   *
   * @param limit - Maximum rows to return (`take`).
   * @param page - 1-based page index; values below `1` are treated as page `1`
   *   via `Math.max(0, …)` on the computed skip.
   * @returns The jobs for this page (may be shorter than {@link limit} on the last page).
   */
  findAll(limit: number, page: number): Promise<ExecutionJob[]>

  /**
   * Requests cancellation of a run's active jobs.
   *
   * `QUEUED` jobs were never claimed and move directly to `CANCELLED`.
   * `RUNNING` jobs stay `RUNNING` with `cancellationRequestedAt` set so the
   * executing node can observe the request; their eventual terminal callback
   * is neutralized by the workflow step guards.
   *
   * @param runId - Primary key of the owning workflow run.
   * @param options - Optional transaction client.
   */
  requestCancellationForRun(runId: string, options?: { transaction?: DatabaseTransaction }): Promise<void>
}

/**
 * Prisma-backed implementation of {@link ExecutionJobRepository}.
 *
 * Responsibilities:
 * - persist new jobs and map JSON-backed fields to Prisma input values,
 * - query persisted rows and map them to domain {@link ExecutionJob} objects,
 * - select claim candidates by availability, kind, priority, and worker
 *   requirements,
 * - claim jobs safely under concurrency through a conditional
 *   `QUEUED` → `RUNNING` update,
 * - perform guarded terminal transitions from `RUNNING` to `COMPLETED` or
 *   `FAILED`.
 *
 * Claiming evaluates at most 100 ordered candidates per request. The
 * conditional update acts as an optimistic lock: if another worker claims a
 * candidate first, this repository continues to the next eligible candidate.
 *
 * This provider is registered under {@link EXECUTION_JOB_REPOSITORY}; consumers
 * should depend on the {@link ExecutionJobRepository} interface rather than
 * instantiate this class directly.
 */
@Injectable()
export class ExecutionJobRepositoryImpl implements ExecutionJobRepository {
  // MARK: - Constructor

  /**
   * Creates a Prisma-backed execution-job repository.
   *
   * @param database - Application database client used for persistence,
   *   conditional updates, and paginated queries.
   */
  constructor(private readonly database: Database) {}

  // MARK: - ExecutionJobRepository

  /**
   * Atomically claims the next ready queued job that this worker can run.
   *
   * Selects candidates with `status = QUEUED`, `availableAt <= now`, and
   * `kind` in {@link ClaimExecutionJobParameters.supportedKinds}, ordered by
   * `priority` descending then `createdAt` ascending. Each candidate’s
   * `requirements` are matched against the worker’s capabilities and labels;
   * the first successful optimistic update (`QUEUED` → `RUNNING`) wins.
   *
   * Concurrent claimants are safe: `updateMany` gated on `QUEUED` ensures only
   * one worker transitions a given row. Unclaimed races simply try the next
   * candidate.
   *
   * @param parameters - Worker identity, supported kinds, and matching metadata.
   * @returns The claimed job now in `RUNNING`, or `null` if none were eligible
   *   or all candidates were claimed by others first.
   */
  async claimNextAvailable(parameters: ClaimExecutionJobParameters): Promise<ExecutionJob | null> {
    const now = new Date()
    const candidates = await this.database.executionJob.findMany({
      where: {
        availableAt: {
          lte: now,
        },
        kind: {
          in: parameters.supportedKinds,
        },
        status: ExecutionJobStatus.QUEUED,
      },
      orderBy: [
        {
          priority: 'desc',
        },
        {
          createdAt: 'asc',
        },
      ],
      take: 100,
    })

    for (const candidate of candidates) {
      const requirements = ExecutionJobRequirementsSchema.parse(candidate.requirements)

      if (!this.executionJobMatchesRequirements(requirements, parameters)) {
        continue
      }

      const claimToken = randomUUID()
      const result = await this.database.executionJob.updateMany({
        where: {
          id: candidate.id,
          status: ExecutionJobStatus.QUEUED,
        },
        data: {
          claimToken,
          claimedByNodeId: parameters.nodeId,
          startedAt: now,
          status: ExecutionJobStatus.RUNNING,
        },
      })

      if (result.count !== 1) {
        continue
      }

      const executionJob = await this.database.executionJob.findUnique({
        where: {
          id: candidate.id,
        },
      })

      if (!executionJob) {
        throw new Error(`Execution job ${candidate.id} disappeared after being claimed`)
      }

      return ExecutionJob.from(executionJob)
    }

    return null
  }

  /**
   * Marks a running job as successfully completed.
   *
   * Uses a conditional update as an optimistic state guard: jobs that are
   * missing or not currently `RUNNING` are left unchanged.
   *
   * @param id - Primary key of the job to complete.
   * @param request - Request to complete the job.
   * @returns `true` if the `RUNNING` → `COMPLETED` transition succeeded;
   *   otherwise `false`.
   */
  async complete(id: string, request: CompleteExecutionJobRequest): Promise<boolean> {
    const result = await this.database.executionJob.updateMany({
      where: {
        id,
        claimToken: request.claimToken,
        claimedByNodeId: request.nodeId,
        status: ExecutionJobStatus.RUNNING,
      },
      data: {
        completedAt: new Date(),
        failedAt: null,
        failure: Prisma.DbNull,
        status: ExecutionJobStatus.COMPLETED,
        result: request.result === undefined ? Prisma.DbNull : (request.result as Prisma.InputJsonValue),
      },
    })

    if (result.count === 1) {
      return true
    }

    const executionJob = await this.database.executionJob.findUnique({
      where: {
        id,
      },
      select: {
        claimToken: true,
        claimedByNodeId: true,
        status: true,
      },
    })

    return (
      executionJob?.status == ExecutionJobStatus.COMPLETED &&
      executionJob?.claimToken === request.claimToken &&
      executionJob?.claimedByNodeId === request.nodeId
    )
  }

  /**
   * Inserts a new job in `QUEUED` (or equivalent ready) state and returns the
   * persisted row.
   *
   * @param parameters - Enqueue parameters (kind, payload, policy, requirements, etc.).
   * @param options - Optional transaction client.
   * @returns The created {@link ExecutionJob}, including generated `id` and timestamps.
   */
  async create(
    parameters: CreateExecutionJobParameters,
    options?: { transaction?: DatabaseTransaction },
  ): Promise<ExecutionJob> {
    const policy = ExecutionJobPolicySchema.parse(parameters.policy)
    const requirements = ExecutionJobRequirementsSchema.parse(parameters.requirements)
    const client = options?.transaction ?? this.database
    const executionJob = await client.executionJob.create({
      data: {
        availableAt: parameters.availableAt ?? new Date(),
        kind: parameters.kind,
        maximumAttempts: parameters.maximumAttempts ?? 1,
        payload: parameters.payload as Prisma.InputJsonValue,
        payloadVersion: parameters.payloadVersion ?? 1,
        policy,
        priority: parameters.priority ?? 0,
        runId: parameters.runId,
        sourceIdentifier: parameters.source?.identifier,
        sourceType: parameters.source?.type,
        stepId: parameters.stepId,
        requirements: {
          allOf: requirements.allOf,
          ...(requirements.anyOf
            ? {
                anyOf: requirements.anyOf,
              }
            : {}),
          ...(requirements.labels
            ? {
                labels: requirements.labels,
              }
            : {}),
          ...(requirements.noneOf
            ? {
                noneOf: requirements.noneOf,
              }
            : {}),
        },
      },
    })

    return ExecutionJob.from(executionJob)
  }

  /**
   * Marks a running job as failed.
   *
   * Uses a conditional update as an optimistic state guard: jobs that are
   * missing or not currently `RUNNING` are left unchanged.
   *
   * @param id - Primary key of the job to fail.
   * @param request - Request to fail the job.
   * @returns `true` if the `RUNNING` → `FAILED` transition succeeded;
   *   otherwise `false`.
   */
  async fail(id: string, request: FailExecutionJobRequest): Promise<boolean> {
    const result = await this.database.executionJob.updateMany({
      where: {
        id,
        claimToken: request.claimToken,
        claimedByNodeId: request.nodeId,
        status: ExecutionJobStatus.RUNNING,
      },
      data: {
        completedAt: null,
        failedAt: new Date(),
        failure: request.failure as Prisma.InputJsonValue,
        result: Prisma.DbNull,
        status: ExecutionJobStatus.FAILED,
      },
    })

    if (result.count === 1) {
      return true
    }

    const executionJob = await this.database.executionJob.findUnique({
      where: {
        id,
      },
      select: {
        claimToken: true,
        claimedByNodeId: true,
        status: true,
      },
    })

    return (
      executionJob?.status == ExecutionJobStatus.FAILED &&
      executionJob?.claimToken === request.claimToken &&
      executionJob?.claimedByNodeId === request.nodeId
    )
  }

  /**
   * Loads a single job by primary key.
   *
   * Performs a point lookup with no status filter, so queued, running, and
   * terminal jobs are all returned when present. The Prisma row is mapped to
   * a domain {@link ExecutionJob} via {@link ExecutionJob.from}, including
   * JSON fields such as `payload`, `result`, and `failure`.
   *
   * A missing row is an expected outcome and returns `null`; it is not an
   * error. Persistence failures propagate to the caller.
   *
   * @param id - Stable primary key of the execution job (`ExecutionJob.id`).
   * @param options - Optional transaction client.
   * @returns The domain job when found; otherwise `null`.
   */
  async findById(
    id: string,
    options?: { transaction?: DatabaseTransaction },
  ): Promise<ExecutionJob | null> {
    const client = options?.transaction ?? this.database
    const executionJob = await client.executionJob.findUnique({
      where: {
        id,
      },
    })

    if (!executionJob) {
      return null
    }

    return ExecutionJob.from(executionJob)
  }

  /**
   * Loads the earliest job linked to a workflow step.
   *
   * @param stepId - Owning workflow step primary key.
   * @param options - Optional transaction client.
   * @returns The domain job when found; otherwise `null`.
   */
  async findByStepId(
    stepId: string,
    options?: { transaction?: DatabaseTransaction },
  ): Promise<ExecutionJob | null> {
    const client = options?.transaction ?? this.database
    const executionJob = await client.executionJob.findFirst({
      where: {
        stepId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (!executionJob) {
      return null
    }

    return ExecutionJob.from(executionJob)
  }

  /**
   * Returns a page of jobs ordered by `createdAt` descending (newest first).
   *
   * Uses 1-based {@link page}: `skip = (page - 1) * limit`. Does not filter by
   * status or kind — add dedicated query methods when those are needed.
   *
   * @param limit - Maximum rows to return (`take`).
   * @param page - 1-based page index; values below `1` are treated as page `1`
   *   via `Math.max(0, …)` on the computed skip.
   * @returns The jobs for this page (may be shorter than {@link limit} on the last page).
   */
  async findAll(limit: number, page: number): Promise<ExecutionJob[]> {
    const executionJobs = await this.database.executionJob.findMany({
      skip: Math.max(0, (page - 1) * limit),
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return executionJobs.map(ExecutionJob.from)
  }

  /**
   * Requests cancellation of a run's active jobs.
   *
   * Applies two conditional bulk updates: `QUEUED` jobs (never claimed) move
   * directly to `CANCELLED`, while `RUNNING` jobs keep their status and only
   * record `cancellationRequestedAt` for the executing node to observe. Jobs
   * already terminal are left unchanged.
   *
   * @param runId - Primary key of the owning workflow run.
   * @param options - Optional transaction client.
   */
  async requestCancellationForRun(runId: string, options?: { transaction?: DatabaseTransaction }): Promise<void> {
    const client = options?.transaction ?? this.database
    const cancellationRequestedAt = new Date()

    await client.executionJob.updateMany({
      where: {
        runId,
        status: ExecutionJobStatus.QUEUED,
      },
      data: {
        cancellationRequestedAt,
        status: ExecutionJobStatus.CANCELLED,
      },
    })

    await client.executionJob.updateMany({
      where: {
        runId,
        status: ExecutionJobStatus.RUNNING,
      },
      data: {
        cancellationRequestedAt,
      },
    })
  }

  // MARK: - Private methods

  private executionJobMatchesRequirements(
    requirements: ExecutionJobRequirements,
    parameters: ClaimExecutionJobParameters,
  ): boolean {
    const capabilities = new Set(parameters.capabilities)
    const labels = new Set(parameters.labels)

    const satisfiesAllOf = requirements.allOf.every((capability) => capabilities.has(capability))
    const satisfiesNoneOf = !requirements.noneOf?.some((capability) => capabilities.has(capability))
    const satisfiesLabels = !requirements.labels?.length || requirements.labels?.every((label) => labels.has(label))

    const satisfiesAnyOf =
      !requirements.anyOf?.length || requirements.anyOf.some((capability) => capabilities.has(capability))

    return satisfiesAllOf && satisfiesAnyOf && satisfiesNoneOf && satisfiesLabels
  }
}
