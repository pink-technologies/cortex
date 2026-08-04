// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Validates the request body a Node sends when marking an execution job complete.
 *
 * Posted to the Cortex API complete endpoint after the Node finishes processing
 * a claimed job successfully. The schema is strict so unknown properties fail
 * closed and surface protocol drift between workers and the control plane.
 *
 * Field semantics:
 * - `claimToken` — UUID issued at claim time; required to authorize completion
 * - `nodeId` — identifier of the Node that holds the claim
 * - `result` — optional, opaque handler outcome; omit for kinds with no
 *   protocol outcome (for example `"system.test"`). The shared protocol does
 *   not interpret this value; the API validates it against the contract schema
 *   published for the job's kind (for example the agent-execute result schema
 *   for `agent.execute`)
 */
export const CompleteExecutionJobRequestSchema = z
  .object({
    /**
     * Claim token issued when the job was claimed.
     *
     * Must match the token stored on the running job or the transition is rejected.
     */
    claimToken: z.uuid(),

    /**
     * Identifier of the Node that claimed the job.
     */
    nodeId: z.string().min(1),

    /**
     * Opaque outcome of a result-producing job, when applicable.
     *
     * Absent or undefined for jobs that only need a lifecycle transition to
     * completed. When present, the API validates it against the contract
     * schema registered for the job's kind.
     */
    result: z.unknown().optional(),
  })
  .strict()

/**
 * Validated execution-job completion request exchanged through the shared protocol.
 *
 * Derived from {@link CompleteExecutionJobRequestSchema} so runtime validation
 * and the TypeScript representation remain synchronized.
 */
export type CompleteExecutionJobRequest = z.infer<typeof CompleteExecutionJobRequestSchema>
