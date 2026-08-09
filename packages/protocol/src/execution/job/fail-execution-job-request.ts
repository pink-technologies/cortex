// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { ExecutionJobFailureSchema } from './execution-job-failure'

/**
 * Validates the request body a Node sends when marking an execution job failed.
 *
 * Posted to the Cortex API fail endpoint after a claimed job cannot finish
 * successfully. The control plane uses this payload to perform a guarded
 * `RUNNING` → `FAILED` transition and persist a sanitized
 * {@link ExecutionJobFailureSchema} outcome. The schema is strict so unknown
 * properties fail closed and surface protocol drift between workers and the
 * control plane.
 *
 * Field semantics:
 * - `claimToken` — UUID issued at claim time; required to authorize failure
 * - `failure` — required sanitized failure; must satisfy
 *   {@link ExecutionJobFailureSchema} (stable `code` plus safe `message`)
 * - `nodeId` — UUID of the Node that holds the claim
 */
export const FailExecutionJobRequestSchema = z
  .object({
    /**
     * Claim token issued when the job was claimed.
     *
     * Must match the token stored on the running job or the transition is rejected.
     */
    claimToken: z.uuid(),

    /**
     * Sanitized description of why the job failed.
     *
     * Must satisfy {@link ExecutionJobFailureSchema}. Do not include stack
     * traces or provider internals; those belong in Node logs only.
     */
    failure: ExecutionJobFailureSchema,

    /**
     * UUID of the Node that claimed the job.
     */
    nodeId: z.uuid(),
  })
  .strict()

/**
 * Validated execution-job failure request exchanged through the shared protocol.
 *
 * Derived from {@link FailExecutionJobRequestSchema} so runtime validation and
 * the TypeScript representation remain synchronized.
 */
export type FailExecutionJobRequest = z.infer<typeof FailExecutionJobRequestSchema>
