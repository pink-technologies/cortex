// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod';
import { AgentRole } from '@/agents/agent/agent';
import { LLMProviderType } from '@/llm/provider/llm-provider';

/**
 * Validates one entry in a `[[configuration.options]]` array inside `agent.toml`.
 *
 * Used when `type` is `select` or `multiselect` to describe allowed choices shown in
 * operator UI. Each option pairs a stored {@link agentConfigurationOptionSchema.value}
 * with a human-readable {@link agentConfigurationOptionSchema.label}.
 *
 * @example
 * ```toml
 * [[configuration.options]]
 * value = "last_30_days"
 * label = "Last 30 days"
 * ```
 */
export const agentConfigurationOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
})

/**
 * Validates one `[[configuration]]` block in `agent.toml`.
 *
 * Describes a single operator-facing setting for an agent (connection picker, time
 * window, free text, etc.). Blocks are collected under the top-level `configuration`
 * key after TOML decode and validated as part of {@link agentSchema}.
 *
 * Field semantics:
 * - `type` — control kind: `multiselect`, `select`, or `text`.
 * - `source` — optional catalog hint (for example `connections:trello`) when values
 *   are loaded from an integration rather than static `options`.
 * - `options` — static choices; required for `select` / `multiselect` when `source`
 *   is omitted. In TOML, declare `[[configuration.options]]` immediately after the
 *   parent `[[configuration]]` row so the parser attaches options to the right block.
 * - `default` — pre-selected value when the operator has not chosen one yet.
 *
 * @example
 * ```toml
 * [[configuration]]
 * key = "default_time_window"
 * label = "Default Time Window"
 * description = "Default analysis period when the user does not specify one."
 * type = "select"
 * required = true
 * default = "last_30_days"
 *
 * [[configuration.options]]
 * value = "last_7_days"
 * label = "Last 7 days"
 * ```
 */
export const agentConfigurationSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  type: z.enum(['multiselect', 'select', 'text']),
  required: z.boolean(),
  source: z.string().optional(),
  default: z.string().optional(),
  options: z.array(agentConfigurationOptionSchema).optional(),
})

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
  capabilities: z.array(z.string()),
  description: z.string(),
  prompt_file: z.string(),
  skills: z.array(z.string()),
  skill_groups: z.array(z.string()),
  delegates_to: z.array(z.string()),
  tags: z.array(z.string()),
  configuration: z.array(agentConfigurationSchema).optional(),
  execution: z.object({
    timeout_ms: z.number(),
    max_iterations: z.number(),
  }),
  llm: z.object({
    model: z.string(),
    max_tokens: z.number(),
    temperature: z.number(),
    provider: z.preprocess(
      (val) => (typeof val === 'string' ? val.toLowerCase() : val),
      z.enum([LLMProviderType.anthropic, LLMProviderType.openAI]),
    ),
  }),
  role: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.enum([AgentRole.Main, AgentRole.Specialist]),
  ),
  safety: z.object({
    allow_skill_use: z.boolean().optional(),
    allow_capability_use: z.boolean().optional(),
    allow_delegation: z.boolean().optional(),
    max_delegation_depth: z.number(),
  }),
})