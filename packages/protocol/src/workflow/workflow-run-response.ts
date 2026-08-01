// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { WorkflowRunStatusSchema } from './workflow-run-status'
import { WorkflowStepStatusSchema } from './workflow-step-status'

/**
 * Validates one step entry inside the workflow-run read response.
 *
 * A read-model projection of a persisted workflow step: identity, ordering,
 * kind, lifecycle status, and lifecycle timestamps. Payloads (`input`,
 * `output`) are intentionally omitted from the public read model.
 */
export const WorkflowRunStepSchema = z
  .object({
    /**
     * Stable identifier of the workflow step.
     */
    id: z.string().min(1),

    /**
     * ISO-8601 timestamp when the step completed successfully.
     *
     * `null` when the step has not completed successfully.
     */
    completedAt: z.iso.datetime().nullable(),

    /**
     * ISO-8601 timestamp when the step entered a terminal failure state.
     *
     * `null` when the step has not failed.
     */
    failedAt: z.iso.datetime().nullable(),

    /**
     * Execution-job kind enqueued when this `JOB` step activates.
     *
     * `null` for `APPROVAL` steps.
     */
    jobKind: z.string().min(1).nullable(),

    /**
     * Definition-scoped step key (for example `"triage"`).
     */
    key: z.string().min(1),

    /**
     * Step kind: `JOB` runs an execution job; `APPROVAL` waits for a human
     * decision.
     */
    kind: z.enum(['APPROVAL', 'JOB']),

    /**
     * Zero-based order of the step within the run.
     */
    position: z.number().int().min(0),

    /**
     * ISO-8601 timestamp when the step was activated.
     *
     * `null` while the step is `PENDING`.
     */
    startedAt: z.iso.datetime().nullable(),

    /**
     * Current lifecycle status of the step.
     */
    status: WorkflowStepStatusSchema,
  })
  .strict()

/**
 * Validated step entry of the workflow-run read response.
 */
export type WorkflowRunStep = z.infer<typeof WorkflowRunStepSchema>

/**
 * Validates the response body returned when reading a workflow run.
 *
 * Returned by run retrieval and by the approve/reject decision endpoints,
 * which respond with the refreshed run after the decision applies. This is a
 * read-model projection: run identity, lifecycle status and timestamps, the
 * persisted outcome, and the ordered steps. The schema is strict so unknown
 * properties fail closed and surface protocol drift between API and clients.
 */
export const WorkflowRunResponseSchema = z
  .object({
    /**
     * Stable identifier of the workflow run.
     */
    id: z.string().min(1),

    /**
     * ISO-8601 timestamp when the run completed successfully.
     *
     * `null` when the run has not completed successfully.
     */
    completedAt: z.iso.datetime().nullable(),

    /**
     * ISO-8601 timestamp when the run was accepted and persisted.
     */
    createdAt: z.iso.datetime(),

    /**
     * Registry key of the workflow definition that produced this run.
     */
    definitionKey: z.string().min(1),

    /**
     * ISO-8601 timestamp when the run entered a terminal failure state.
     *
     * `null` when the run has not failed.
     */
    failedAt: z.iso.datetime().nullable(),

    /**
     * Sanitized failure payload persisted for the run.
     *
     * `null` until the run fails.
     */
    failure: z.unknown().nullable(),

    /**
     * Aggregated or final result persisted for the run.
     *
     * `null` until the run completes with a result.
     */
    result: z.unknown().nullable(),

    /**
     * ISO-8601 timestamp when the run left `PENDING`.
     *
     * `null` while the run is `PENDING`.
     */
    startedAt: z.iso.datetime().nullable(),

    /**
     * Current lifecycle status of the run.
     */
    status: WorkflowRunStatusSchema,

    /**
     * Ordered steps belonging to the run (ascending `position`).
     */
    steps: z.array(WorkflowRunStepSchema),
  })
  .strict()

/**
 * Validated workflow-run read response exchanged through the shared protocol.
 */
export type WorkflowRunResponse = z.infer<typeof WorkflowRunResponseSchema>
