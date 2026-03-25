// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from "zod";
import { configSchema } from "@/shared/types/schema/config.schema";

/**
 * Schema for the capability bundle.
 * 
 * @example
 * ```toml
 * id = "jira"
 * name = "Jira"
 * version = "1.0.0"
 * description = "Interact with Jira issues and workflows through structured read, search, and write operations."
 * type = "integration"
 * tools = ["jira"]
 * tags = ["jira", "tickets", "project-management", "external"]
 * actions = ["read", "search", "write"]
 * execution = {
 *   timeout_ms = 15000
 *   max_concurrency = 5
 * }
 * safety = {
 *   requires_confirmation = false
 *   allow_background = false
 * }
 * constraints = {
 *   max_iterations = 5
 *   max_rows = 1000
 *   allow_raw_queries = false
 * }
 * auth = {
 *   required = true
 *   connection_type = "jira"
 *   multiple = true
 * }
 * config = [
 *   {
 *     key = "connection_id"
 *     label = "Jira Connection"
 *     description = "Select the Jira connection this capability should use."
 *     type = "select"
 *     required = true
 *     source = "connections:jira"
 *   }
 *   {
 *     key = "default_project_key"
 *     label = "Default Project Key"
 *     description = "Optional default Jira project used when no project is specified."
 *     type = "text"
 *     required = false
 *   }
 * ]
 */
export const capabilitySchema = z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    description: z.string(),
    type: z.enum(["integration", "domain"]),
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
export type CapabilitySchema = z.infer<typeof capabilitySchema>;
