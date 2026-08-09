// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { ExecutionJobSchema } from './execution-job'

/**
 * Validates a successful execution-job claim response.
 *
 * The response wraps the claimed job in a stable top-level object so the
 * protocol can evolve without changing the job representation itself. The
 * schema is strict and rejects unknown response properties.
 */
export const ClaimExecutionJobResponseSchema = z
  .object({
    /**
     * Job assigned to the requesting node.
     *
     * The nested value must satisfy {@link ExecutionJobSchema}, including its
     * lifecycle status, policy, payload metadata, and ISO-8601 timestamps.
     */
    job: ExecutionJobSchema.nullable(),
  })
  .strict()

/**
 * Validated successful claim response exchanged through the shared protocol.
 *
 * Derived from {@link ClaimExecutionJobResponseSchema} so runtime validation
 * and the TypeScript representation remain synchronized.
 */
export type ClaimExecutionJobResponse = z.infer<typeof ClaimExecutionJobResponseSchema>
