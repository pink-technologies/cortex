// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { ExecutionJobFailureSchema } from './execution-job-failure'

/**
 * Validates the response body returned when retrieving an execution job.
 *
 * Returned by the Cortex API get-job endpoint after a client looks up a job by
 * id. This is a read-model projection of lifecycle state and any persisted
 * outcome—not the full {@link ExecutionJob} claim envelope (no payload, policy,
 * or lease fields). The schema is strict so unknown properties fail closed and
 * surface protocol drift between API and clients.
 *
 * Field semantics:
 * - `id` — stable job UUID assigned at enqueue time
 * - `kind` — handler discriminator (for example `"agent.execute"`)
 * - `status` — current lifecycle state (for example `QUEUED`, `RUNNING`,
 *   `COMPLETED`, `FAILED`)
 * - `createdAt` — ISO-8601 timestamp when the job was persisted
 * - `completedAt` — ISO-8601 timestamp when the job completed successfully;
 *   `null` otherwise
 * - `failedAt` — ISO-8601 timestamp when the job entered a terminal failure
 *   state; `null` otherwise
 * - `result` — opaque, kind-specific handler outcome when present; `null`
 *   until a result-producing job completes successfully
 * - `failure` — sanitized failure payload when present; `null` until the job
 *   fails
 * - `runId` — owning workflow-run UUID; `null` for standalone jobs
 */
export const ExecutionJobResponseSchema = z
  .object({
    /**
     * Stable UUID of the execution job.
     */
    id: z.uuid(),

    /**
     * ISO-8601 timestamp when the job completed successfully.
     *
     * `null` when the job has not completed successfully.
     */
    completedAt: z.iso.datetime().nullable(),

    /**
     * ISO-8601 timestamp when the job was accepted and persisted.
     */
    createdAt: z.iso.datetime(),

    /**
     * ISO-8601 timestamp when the job entered a terminal failure state.
     *
     * `null` when the job has not failed.
     */
    failedAt: z.iso.datetime().nullable(),

    /**
     * Sanitized failure payload persisted for the job.
     *
     * `null` until the job fails. When set, must satisfy
     * {@link ExecutionJobFailureSchema}.
     */
    failure: ExecutionJobFailureSchema.nullable(),

    /**
     * Non-empty discriminator used to route and interpret the job.
     *
     * Examples include `"agent.execute"` and `"system.test"`.
     */
    kind: z.string().min(1),

    /**
     * Opaque, kind-specific handler outcome, when one exists.
     *
     * `null` for jobs that have not completed with a result, or for kinds that
     * do not produce a protocol outcome. The shared protocol does not
     * interpret this value; consumers validate it against the contract schema
     * published for the job's `kind` (for example the agent-execute result
     * schema for `agent.execute`).
     */
    result: z.unknown().nullable(),

    /**
     * UUID of the workflow run that owns this job as one of its steps.
     *
     * Follow it to `GET /workflow-runs/:id` to observe overall run progress.
     * `null` for jobs that do not belong to a workflow run.
     */
    runId: z.uuid().nullable(),

    /**
     * Current lifecycle status of the job.
     *
     * Aligns with the execution-job status vocabulary used by persistence
     * (for example `QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`).
     */
    status: z.string().min(1),
  })
  .strict()

/**
 * Validated execution-job read response exchanged through the shared protocol.
 *
 * Derived from {@link ExecutionJobResponseSchema} so runtime validation and
 * the TypeScript representation remain synchronized.
 */
export type ExecutionJobResponse = z.infer<typeof ExecutionJobResponseSchema>
