// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Database, Prisma, ExecutionJobStatus } from '@/infraestructure/database'
import { ClaimExecutionJobParameters, CreateExecutionJobParameters } from './parameters'
import { ExecutionJob } from './models/execution-job'
import { Injectable } from '@nestjs/common'
import { ExecutionJobMapper } from './mapper/execution-job-mapper'
import { ExecutionJobRequirements } from './models'

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
 * Prisma model (including JSON fields and uniqueness for `activeKey` /
 * `triggerIdentifier`). Callers should not talk to Prisma directly for job CRUD.
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
     * The transition is conditional (`RUNNING` → `COMPLETED`) and releases the
     * job's `activeKey` so another job may reuse it.
     *
     * @param id - Primary key of the job to complete.
     * @returns `true` when one running job was transitioned; `false` when the
     *   job does not exist or is no longer `RUNNING`.
     */
    complete(id: string): Promise<boolean>

    /**
     * Inserts a new job in `QUEUED` (or equivalent ready) state and returns the
     * persisted row.
     *
     * @param parameters - Enqueue parameters (kind, payload, policy, requirements, etc.).
     * @returns The created {@link ExecutionJob}, including generated `id` and timestamps.
     * @throws When `activeKey` or `triggerIdentifier` collide with an existing unique row.
     */
    create(parameters: CreateExecutionJobParameters): Promise<ExecutionJob>

    /**
     * Marks a running job as failed.
     *
     * The transition is conditional (`RUNNING` → `FAILED`) and releases the
     * job's `activeKey` so another job may reuse it.
     *
     * @param id - Primary key of the job to fail.
     * @returns `true` when one running job was transitioned; `false` when the
     *   job does not exist or is no longer `RUNNING`.
     */
    fail(id: string): Promise<boolean>

    /**
     * Loads a single job by primary key.
     *
     * @param id - `ExecutionJob.id`.
     * @returns The job, or `null` if it does not exist.
     */
    findById(id: string): Promise<ExecutionJob | null>

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
 *   `FAILED`, releasing `activeKey` on either outcome.
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
            const requirements = candidate.requirements as unknown as ExecutionJobRequirements

            if (!this.executionJobMatchesRequirements(requirements, parameters)) {
                continue
            }

            const result = await this.database.executionJob.updateMany({
                where: {
                    id: candidate.id,
                    status: ExecutionJobStatus.QUEUED,
                },
                data: {
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
                throw new Error(
                    `Execution job ${candidate.id} disappeared after being claimed`
                )
            }

            return ExecutionJobMapper.from(executionJob)
        }

        return null
    }

    /**
     * Marks a running job as successfully completed.
     *
     * Uses a conditional update as an optimistic state guard: jobs that are
     * missing or not currently `RUNNING` are left unchanged. A successful
     * transition also clears `activeKey`.
     *
     * @param id - Primary key of the job to complete.
     * @returns `true` if the `RUNNING` → `COMPLETED` transition succeeded;
     *   otherwise `false`.
     */
    async complete(id: string): Promise<boolean> {
        const result = await this.database.executionJob.updateMany({
            where: { 
                id,
                status: ExecutionJobStatus.RUNNING,
            },
            data: { 
                status: ExecutionJobStatus.COMPLETED,
                activeKey: null,
            },
        })
        
        return result.count === 1
    }

    /**
     * Inserts a new job in `QUEUED` (or equivalent ready) state and returns the
     * persisted row.
     *
     * @param parameters - Enqueue parameters (kind, payload, policy, requirements, etc.).
     * @returns The created {@link ExecutionJob}, including generated `id` and timestamps.
     * @throws When `activeKey` or `triggerIdentifier` collide with an existing unique row.
     */
    async create(parameters: CreateExecutionJobParameters): Promise<ExecutionJob> {
        const executionJob = await this.database.executionJob.create({
            data: {
                activeKey: parameters.activeKey,
                availableAt: parameters.availableAt ?? new Date(),
                kind: parameters.kind,
                maximumAttempts: parameters.maximumAttempts ?? 1,
                payload: parameters.payload as Prisma.InputJsonValue,
                payloadVersion: parameters.payloadVersion ?? 1,
                policy: parameters.policy as Prisma.InputJsonValue,
                priority: parameters.priority ?? 0,
                sourceIdentifier: parameters.source?.identifier,
                sourceType: parameters.source?.type,
                triggerIdentifier: parameters.triggerIdentifier,
                requirements: {
                    allOf: parameters.requirements.allOf,
                    ...(parameters.requirements.anyOf
                        ? {
                              anyOf: parameters.requirements.anyOf,
                          }
                        : {}),
                    ...(parameters.requirements.labels
                        ? {
                              labels: parameters.requirements.labels,
                          }
                        : {}),
                    ...(parameters.requirements.noneOf
                        ? {
                              noneOf: parameters.requirements.noneOf,
                          }
                        : {}),
                }
            },
        })

        return ExecutionJobMapper.from(executionJob)
    }

    /**
     * Marks a running job as failed.
     *
     * Uses a conditional update as an optimistic state guard: jobs that are
     * missing or not currently `RUNNING` are left unchanged. A successful
     * transition also clears `activeKey`.
     *
     * @param id - Primary key of the job to fail.
     * @returns `true` if the `RUNNING` → `FAILED` transition succeeded;
     *   otherwise `false`.
     */
    async fail(id: string): Promise<boolean> {
        const result = await this.database.executionJob.updateMany({
            where: { 
                id,
                status: ExecutionJobStatus.RUNNING,
            },
            data: { 
                status: ExecutionJobStatus.FAILED,
                activeKey: null,
            },
        })

        return result.count === 1
    }

    /**
     * Loads a single job by primary key.
     *
     * @param id - `ExecutionJob.id`.
     * @returns The job, or `null` if it does not exist.
     */
    async findById(id: string): Promise<ExecutionJob | null> {
        const executionJob = await this.database.executionJob.findUnique({
            where: {
                id,
            },
        })

        if (!executionJob) {
            return null
        }

        return ExecutionJobMapper.from(executionJob)
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

        return executionJobs.map(ExecutionJobMapper.from)
    }

    // MARK: - Private methods

    /**
     * Determines whether a worker satisfies a job's capability and label
     * requirements.
     *
     * Matching rules:
     * - every `allOf` capability must be present,
     * - at least one `anyOf` capability must be present when specified,
     * - no `noneOf` capability may be present,
     * - every required label must be present.
     *
     * @param requirements - Constraints stored on the candidate job.
     * @param parameters - Capabilities and labels advertised by the worker.
     * @returns `true` when the worker satisfies every applicable constraint.
     */
    private executionJobMatchesRequirements(
        requirements: ExecutionJobRequirements, 
        parameters: ClaimExecutionJobParameters
    ): boolean {
        
        const capabilities = new Set(parameters.capabilities)
        const labels = new Set(parameters.labels)
        const satisfiesAllOf = requirements.allOf.every(
            capability => capabilities.has(capability)
        )

        const satisfiesAnyOf = !requirements.anyOf?.length || requirements.anyOf.some(
            capability => capabilities.has(capability)
        )

        const satisfiesNoneOf = !requirements.noneOf?.some(
            capability => capabilities.has(capability)
        )

        const satisfiesLabels = !requirements.labels?.length || requirements.labels?.every(
            label => labels.has(label)
        )

        return satisfiesAllOf && satisfiesAnyOf && satisfiesNoneOf && satisfiesLabels
    }
}