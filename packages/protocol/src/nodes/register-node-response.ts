// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Validates the API response returned after an execution node registers.
 *
 * The response assigns the node's stable server-side identity and tells it how
 * frequently to report liveness. Unknown properties are rejected to expose
 * protocol drift.
 */
export const RegisterNodeResponseSchema = z
  .object({
    /**
     * Required interval between node heartbeat requests, in whole seconds.
     */
    heartbeatIntervalSeconds: z
      .number()
      .int()
      .positive(),

    /**
     * Stable UUID assigned to the registered node.
     *
     * The node uses this identifier in subsequent claim and heartbeat requests.
     */
    nodeId: z
      .uuid(),
  })
  .strict()

/**
 * Validated response from a successful execution-node registration.
 *
 * Derived from {@link RegisterNodeResponseSchema} so runtime validation and the
 * TypeScript representation remain synchronized.
 */
export type RegisterNodeResponse = z.infer<typeof RegisterNodeResponseSchema>