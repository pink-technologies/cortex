// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Validates the worker-matching criteria used to claim an execution job.
 *
 * The claim service uses this strict wire contract to select a queued job whose
 * kind and requirements are compatible with the requesting worker. Unknown
 * properties are rejected to expose protocol drift between clients and the
 * service.
 */
export const ClaimExecutionJobRequestSchema = z.object({
  /**
   * Stable identifier of the node requesting the claim.
   *
   * Used as the lease owner for the resulting execution attempt.
   */
  nodeId: z.uuid(),
}).strict()

/**
 * Validated execution-job claim criteria exchanged through the shared protocol.
 *
 * Derived from {@link ClaimExecutionJobRequestSchema} so runtime validation and
 * the TypeScript representation remain synchronized.
 */
export type ClaimExecutionJobRequest = z.infer<typeof ClaimExecutionJobRequestSchema>