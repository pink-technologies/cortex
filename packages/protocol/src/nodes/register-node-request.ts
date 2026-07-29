// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { NodeArchitectureSchema } from './node-architecture'
import { NodeOperatingSystemSchema } from './node-operating-system'

/**
 * Reusable validator for non-empty protocol identifiers.
 *
 * Surrounding whitespace is removed before validation so whitespace-only
 * capabilities, labels, and job-kind values are rejected.
 */
const IdentifierSchema = z
  .string()
  .trim()
  .min(1)

/**
 * Validates the metadata submitted when an execution node registers with the
 * Cortex API.
 *
 * The request describes the node's host platform, installation ownership, and
 * workload-matching abilities. Unknown properties are rejected to expose
 * protocol drift between nodes and the API.
 */
export const RegisterNodeRequestSchema = z
  .object({
    /** Normalized CPU architecture of the node host. */
    architecture: NodeArchitectureSchema,

    /**
     * Capability identifiers currently offered by the node.
     *
     * At least one capability is required for job-requirement matching.
     */
    capabilities: z
      .array(IdentifierSchema)
      .min(1),

    /** Installation UUID under which the node is being registered. */
    installationId: z
      .string()
      .uuid(),

    /**
     * Additional node attributes used for matching, such as region or pool.
     *
     * An empty array indicates that the node has no additional labels.
     */
    labels: z
      .array(IdentifierSchema),

    /** Human-readable node name, limited to 128 characters. */
    name: z
      .string()
      .trim()
      .min(1)
      .max(128),

    /** Normalized operating system of the node host. */
    operatingSystem: NodeOperatingSystemSchema,

    /**
     * Execution-job kinds the node knows how to process.
     *
     * At least one supported kind is required.
     */
    supportedKinds: z
      .array(IdentifierSchema)
      .min(1),

    /** Optional node software version, limited to 64 characters. */
    version: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .optional(),
  })
  .strict()

/**
 * Validated execution-node registration request.
 *
 * Derived from {@link RegisterNodeRequestSchema} so runtime validation and the
 * TypeScript representation remain synchronized.
 */
export type RegisterNodeRequest = z.infer<typeof RegisterNodeRequestSchema>