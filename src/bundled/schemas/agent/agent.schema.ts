// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from "zod";
import { configSchema } from "@/bundled/schemas/shared/config.schema";

/**
 * Schema for the agent bundle.
 * 
 * @example
 * ```toml
 * id = "main-assistant"
 * name = "Main Assistant"
 * version = "1.0.0"
 * description = "General-purpose coordinator that handles simple requests, uses generic skills, and delegates specialized work."
 * role = "main"
 * prompt_file = "prompt.md"
 * skills = ["text.summarize", "text.translate", "text.spellcheck"]
 * skill_groups = ["text", "translate", "spellcheck"]
 * capabilities = ["jira.read", "jira.write"]
 * delegates_to = ["financial-advisor", "legal-assistant"]
 * tags = ["orchestrator", "general", "user-facing", "coordination", "delegation", "safe"]
 * safety = {
 *   allow_skill_use = true
 *   allow_capability_use = true
 *   allow_delegation = true
 *   max_delegation_depth = 3
 * }
 * execution = {
 *   timeout_ms = 30000
 *   max_iterations = 12
 * }
 * config = [
 *   {
 *     key = "connection_ids"
 *     label = "Data Connections"
 *     description = "Select which connected data providers this agent can use."
 *     type = "multiselect"
 *     required = true
 *     source = "connections:data-provider"
 *   }
 */
export const agentSchema = z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    description: z.string(),
    role: z.enum(["main", "specialist"]),
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
 * Type for the agent bundle.
 */
export type AgentBundle = z.infer<typeof agentSchema>;
