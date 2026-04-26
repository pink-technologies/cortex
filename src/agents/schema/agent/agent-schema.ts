// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from "zod";
import { configSchema } from "@/shared/types/schema/config.schema";
import { AgentRole } from "@/agents/agent/agent";
import { LLMProviderType } from "@/llm/provider/llm-provider";

/**
 * Defines the schema used to validate an agent configuration file.
 *
 * The `agentSchema` describes the complete metadata, execution behavior,
 * language model configuration, safety limits, and orchestration capabilities
 * available to an agent.
 *
 * Agents can represent either a main coordinating agent or a specialist agent.
 * Main agents are typically responsible for routing, delegation, and high-level
 * planning, while specialist agents focus on a narrower domain or task.
 */
export const agentSchema = z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    capabilities: z.array(z.string()).min(1),
    description: z.string(),    
    prompt_file: z.string(),
    skills: z.array(z.string()).min(1),
    skill_groups: z.array(z.string()).min(1),
    delegates_to: z.array(z.string()),
    tags: z.array(z.string()),     
    config: z.array(configSchema).optional(),
    execution: z.object({
        timeout_ms: z.number(),
        max_iterations: z.number(),
    }), 
    llm: z.object({
        model: z.string(),
        max_tokens: z.number(),
        temperature: z.number(),
        provider: z.preprocess(
            (val) => (typeof val === "string" ? val.toLowerCase() : val),
            z.enum([LLMProviderType.anthropic, LLMProviderType.openAI]),
        ),
    }),
    role: z.preprocess(
        (val) => (typeof val === "string" ? val.toLowerCase() : val),
        z.enum([AgentRole.Main, AgentRole.Specialist]),
    ),    
    safety: z.object({
        allow_skill_use: z.boolean().optional(),
        allow_capability_use: z.boolean().optional(),
        allow_delegation: z.boolean().optional(),
        max_delegation_depth: z.number(),
    }),      
});