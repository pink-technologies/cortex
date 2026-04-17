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
    model: z.object({
        provider: z.string(),
        model: z.string(),
        max_tokens: z.number(),
        temperature: z.number(),
    }),
});

/**
 * Type for the agent schema.
 */
type AgentSchemaDto = z.infer<typeof agentSchema>;

/**
 * Type for the agent role.
 */
export type AgentRoleDto = z.infer<typeof agentSchema>["role"];

/**
 * Class for the agent definition.
 */
export class AgentSchema {
    // MARK: - Constructor

    /**
     * Creates a new agent schema.
     * 
     * @param schema - The schema.
     */
    private constructor(readonly schema: AgentSchemaDto) {}

    /**
     * Creates a new agent schema.
     * 
     * @param input - The input schema.
     * @returns The agent schema.
     */
    static from(input: AgentSchemaDto): AgentSchema {
        return new AgentSchema(input);
    }

    // MARK: - Getters

    /**
     * Gets the clean skills.
     * 
     * @returns The clean skills.
     */
    get cleanSkills(): string[] {
        return this.schema.skills.filter((s) => s.length > 0);
    }

    /**
     * Gets the clean capabilities.
     * 
     * @returns The clean capabilities.
     */
    get cleanCapabilities(): string[] {
        return this.schema.capabilities.filter((c) => c.length > 0);
    }

    /**
     * Gets the delegate ids.
     * 
     * @returns The delegate ids.
     */
    get delegateIds(): string[] {
        return this.schema.delegates_to.filter((d) => d.length > 0);
    }

    /**
     * Gets the role.
     * 
     * @returns The role.
     */
    get role(): AgentRoleDto {
        return this.schema.role;
    }

    /**
     * Gets the descriptor base.
     * 
     * @returns The descriptor base.
     */
    get descriptorBase() {
        return {
            name: this.schema.name,
            description: this.schema.description,
        };
    }
}
