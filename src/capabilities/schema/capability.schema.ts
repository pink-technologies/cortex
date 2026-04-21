// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from "zod";
import { configSchema } from "@/shared/types/schema/config.schema";

/**
 * Schema for the capability.
 */
export const capabilitySchema = z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    description: z.string(),
    type: z.preprocess(
        (val) => (typeof val === "string" ? val.toUpperCase() : val),
        z.enum(["INTEGRATION", "DOMAIN"]),
    ),
    tools: z.array(z.string()),
    tags: z.array(z.string()),
    actions: z.array(z.string()),
    execution: z.object({
        timeout_ms: z.number(),
        max_concurrency: z.number(),
    }),
    safety: z.object({
        requires_confirmation: z.boolean(),
        allow_background: z.boolean(),
    }),
    constraints: z.object({
        max_iterations: z.number(),
        max_rows: z.number().optional(),
        allow_raw_queries: z.boolean().optional(),
    }),
    auth: z.object({
        required: z.boolean(),
        connection_type: z.string(),
        multiple: z.boolean().optional(),
    }),
    config: z.array(configSchema),
});

/**
 * Type for the capability schema.
 */
type CapabilitySchemaDto = z.infer<typeof capabilitySchema>;

/**
 * Class for the capability definition.
 */
export class CapabilitySchema {
    // MARK: - Constructor

    /**
     * Creates a new instance of {@link CapabilitySchema}.
     *
     * @param schema - The capability schema.
     */
    private constructor(readonly schema: CapabilitySchemaDto) { }

    // MARK: - Static methods

    /**
     * Wraps an already-validated {@link CapabilitySchemaDto} (e.g. `capabilitySchema.parse` on raw TOML).
     *
     * @param input - Validated capability definition.
     * @returns A new instance of {@link CapabilitySchema}.
     */
    static from(input: CapabilitySchemaDto): CapabilitySchema {
        return new CapabilitySchema(input);
    }
}