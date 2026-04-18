// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from "zod";
import { configSchema } from "@/shared/types/schema/config.schema";

/**
 * Schema for the agent definition.
 */
export const agentSchema = z.object({
    id: z.string(),
    config: z.array(configSchema).optional(),
    description: z.string(),
    name: z.string(),
    version: z.string(),
    prompt_file: z.string(),
    skills: z.array(z.string()),
    skill_groups: z.array(z.string()),
    capabilities: z.array(z.string()),
    delegates_to: z.array(z.string()),
    tags: z.array(z.string()),
    execution: z.object({
        timeout_ms: z.number(),
        max_iterations: z.number(),
    }),
    model: z.object({
        provider: z.string(),
        model: z.string(),
        max_tokens: z.number(),
        temperature: z.number(),
    }),
    role: z.preprocess(
        (val) => (typeof val === "string" ? val.toUpperCase() : val),
        z.enum(["MAIN", "SPECIALIST"]),
    ),
    safety: z.object({
        allow_skill_use: z.boolean().optional(),
        allow_capability_use: z.boolean().optional(),
        allow_delegation: z.boolean().optional(),
        max_delegation_depth: z.number(),
    }),
});

/**
 * Type for the agent schema.
 */
export type AgentSchema = z.infer<typeof agentSchema>;
