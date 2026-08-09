// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { identifierSchema } from '@/manifest/schema/identifier-schema'
import { validateUniqueValues } from '@/manifest'

/**
 * Validates a capability manifest (for example `capability.toml` under a
 * domain package).
 *
 * A capability is an authorization/catalog entry (tool bundle + optional
 * default agent). Node job handlers execute the matching job kind; they are
 * not defined by this schema.
 *
 * Wire keys are snake_case where applicable. After loading, the runtime maps
 * this shape onto {@link CapabilityDefinition} (camelCase `toolNames`).
 *
 * Unknown top-level keys are rejected (`.strict()`). Tool identifiers must be
 * unique within the `tools` list.
 */
export const capabilitySchema = z
  .object({
    /**
     * Stable capability identifier agents reference in their manifests.
     */
    id: identifierSchema,

    /**
     * Optional default agent that owns this capability for job routing.
     *
     * When set, Node process resolvers map the capability / job kind to this
     * agent package instead of hardcoding agent ids in handlers.
     */
    default_agent: identifierSchema.optional(),

    /**
     * Human-readable explanation of what the capability provides.
     */
    description: z.string().trim().min(1),

    /**
     * Tool names this capability contributes when authorized.
     *
     * Defaults to `[]`. Entries must be unique and match
     * {@link identifierSchema}.
     */
    tools: z.array(identifierSchema).default([]),
  })
  .strict()
  .superRefine((value, context) => {
    validateUniqueValues(value.tools, 'tools', context)
  })