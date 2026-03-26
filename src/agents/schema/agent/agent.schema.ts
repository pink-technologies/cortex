// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from "zod";
import { configSchema } from "@/shared/types/schema/config.schema";

/**
 * Schema for the agent definition.
 */
export const agentSchema = z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    description: z.string(),
    role: z.preprocess(
        (val) => (typeof val === "string" ? val.toUpperCase() : val),
        z.enum(["MAIN", "SPECIALIST"]),
    ),
    prompt_file: z.string(),
    skills: z.array(z.string()),
    skill_groups: z.array(z.string()),
    capabilities: z.array(z.string()),
    delegates_to: z.array(z.string()),
    tags: z.array(z.string()),
    safety: z.object({
        allow_skill_use: z.boolean().optional(),
        allow_capability_use: z.boolean().optional(),
        allow_delegation: z.boolean().optional(),
        max_delegation_depth: z.number(),
    }),
    execution: z.object({
        timeout_ms: z.number(),
        max_iterations: z.number(),
    }),
    config: z.array(configSchema).optional(),
});

/**
 * Type for the agent schema.
 */
type AgentSchemaDto = z.infer<typeof agentSchema>;

/**
 * Class for the agent definition.
 */
export class AgentSchema {
    // MARK: - Constructor

    /**
     * Creates a new instance of {@link AgentSchema}.
     *
     * @param schema - The agent schema.
     */
    private constructor(readonly schema: AgentSchemaDto) { }

    // MARK: - Static methods

    /**
     * Wraps an already-validated {@link AgentSchemaDto} (e.g. `agentSchema.parse` on raw TOML).
     *
     * @param input - Validated agent definition.
     * @returns A new instance of {@link AgentSchema}.
     */
    static from(input: AgentSchemaDto): AgentSchema {
        return new AgentSchema(input);
    }
}
