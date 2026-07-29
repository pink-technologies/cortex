// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * NestJS injection token for the validated, immutable
 * {@link NodeConfiguration}.
 */
export const NODE_CONFIGURATION = Symbol('NODE_CONFIGURATION')

/**
 * Runtime validator for environment variables required by a Cortex node.
 *
 * Numeric values are coerced from environment strings. The polling interval
 * defaults to 2,000 milliseconds when `CORTEX_POLL_INTERVAL_MS` is omitted.
 */
const NodeEnvironmentSchema = z.object({
  CORTEX_API_URL: z.url(),
  CORTEX_NODE_ID: z.string().trim().min(1),
  CORTEX_NODE_NAME: z.string().trim().min(1),
  CORTEX_NODE_VERSION: z.string().trim().min(1),
  CORTEX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2_000),
})

/**
 * Validated runtime settings used by a Cortex execution node.
 *
 * This interface exposes application-friendly property names rather than raw
 * environment-variable names. Instances returned by
 * {@link createNodeConfiguration} are frozen to prevent runtime mutation.
 */
export interface NodeConfiguration {
  // MARK: - Properties

  /** Base URL of the Cortex API used for node requests. */
  readonly apiURL: string

  /** Stable identifier used to register and identify this node. */
  readonly nodeId: string

  /** Name of the Cortex Node. */
  readonly nodeName: string

  /** Delay between execution-job polling attempts, in milliseconds. */
  readonly pollingIntervalMilliseconds: number

  /** Version of the Cortex Node. */
  readonly version: string
}

/**
 * Parses and validates the environment configuration for a Cortex node.
 *
 * @param environment - Environment map to parse; defaults to `process.env`.
 * @returns A validated and immutable {@link NodeConfiguration}.
 * @throws {Error} When a required variable is missing or any value is invalid.
 */
export function createNodeConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): NodeConfiguration {
  const result = NodeEnvironmentSchema.safeParse(environment)

  if (!result.success) {
    throw new Error(
      `Invalid Cortex Node configuration:\n${z.prettifyError(result.error)}`,
    )
  }

  return Object.freeze({
    apiURL: result.data.CORTEX_API_URL,
    nodeId: result.data.CORTEX_NODE_ID,
    nodeName: result.data.CORTEX_NODE_NAME,
    pollingIntervalMilliseconds: result.data.CORTEX_POLL_INTERVAL_MS,
    version: result.data.CORTEX_NODE_VERSION,
  })
}
