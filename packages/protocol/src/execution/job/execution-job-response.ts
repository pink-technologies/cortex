// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { AgentExecuteJobResultSchema } from '../agent/agent-execute-job-result'
import { JiraTriageJobResultSchema } from '../jira/jira-triage-job-result'
import { RepositoryReviewJobResultSchema } from '../review/repository-review-job-result'
import { ExecutionJobFailureSchema } from './execution-job-failure'

/**
 * Result persisted for a supported execution job when retrieving job status.
 *
 * Keep this union aligned with the completion-side result schema so get and
 * complete share one outcome shape on the wire. Supported members are
 * {@link AgentExecuteJobResultSchema} (`agent.execute`),
 * {@link RepositoryReviewJobResultSchema} (`repository.review`), and
 * {@link JiraTriageJobResultSchema} (`jira.triage`).
 */
export const ExecutionJobResultSchema = z.union([
  AgentExecuteJobResultSchema,
  RepositoryReviewJobResultSchema,
  JiraTriageJobResultSchema,
])

/**
 * Validated completion/read result for a result-producing execution job.
 *
 * Derived from {@link ExecutionJobResultSchema} so get and complete share one
 * outcome shape on the wire.
 */
export type ExecutionJobResult = z.infer<typeof ExecutionJobResultSchema>

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
 * - `id` — stable job identifier assigned at enqueue time
 * - `kind` — handler discriminator (for example `"agent.execute"`)
 * - `status` — current lifecycle state (for example `QUEUED`, `RUNNING`,
 *   `COMPLETED`, `FAILED`)
 * - `createdAt` — ISO-8601 timestamp when the job was persisted
 * - `completedAt` — ISO-8601 timestamp when the job completed successfully;
 *   `null` otherwise
 * - `failedAt` — ISO-8601 timestamp when the job entered a terminal failure
 *   state; `null` otherwise
 * - `result` — persisted handler outcome when present; `null` until a
 *   result-producing job completes successfully
 * - `failure` — sanitized failure payload when present; `null` until the job
 *   fails
 * - `runId` — owning workflow-run identifier; `null` for standalone jobs
 */
export const ExecutionJobResponseSchema = z
  .object({
    /**
     * Stable identifier of the execution job.
     */
    id: z.string().min(1),

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
     * Persisted handler outcome, when one exists.
     *
     * `null` for jobs that have not completed with a result, or for kinds that
     * do not produce a protocol outcome. When set, must satisfy
     * {@link ExecutionJobResultSchema}.
     */
    result: ExecutionJobResultSchema.nullable(),

    /**
     * Identifier of the workflow run that owns this job as one of its steps.
     *
     * Follow it to `GET /workflow-runs/:id` to observe overall run progress.
     * `null` for jobs that do not belong to a workflow run.
     */
    runId: z.string().min(1).nullable(),

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
