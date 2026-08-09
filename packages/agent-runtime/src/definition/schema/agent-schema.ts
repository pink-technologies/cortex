// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { AgentRole } from '@/definition/models/agent-role'
import { agentExecutionSchema } from './agent-execution-schema'
import { agentLLMSchema } from './agent-llm-schema'
import { agentSafetySchema } from './agent-safety-schema'
import { identifierSchema } from '@/manifest/schema/identifier-schema'
import { validateUniqueValues } from '@/manifest'

/**
 * Validates a complete agent manifest (for example `agent.toml` / JSON).
 *
 * Wire keys are snake_case. After loading, the runtime maps this shape onto
 * {@link AgentDefinition} / {@link AgentDescriptor} (camelCase), resolving
 * {@link prompt_file} into {@link AgentDescriptor.systemPrompt}.
 *
 * Nested blocks reuse {@link agentExecutionSchema}, {@link agentLLMSchema},
 * and {@link agentSafetySchema}. Unknown top-level keys are rejected
 * (`.strict()`). Identifier lists must be unique within each field.
 *
 * This schema describes static configuration only—not runtime state,
 * credentials, or an executable agent instance.
 */
export const agentSchema = z
  .object({
    /**
     * Capability identifiers this agent is authorized to use.
     *
     * Defaults to `[]`. Entries must be unique and match
     * {@link identifierSchema}. Effective use also requires
     * {@link agentSafetySchema}'s `allow_capability_use`.
     */
    capabilities: z.array(identifierSchema).default([]),

    /**
     * Agent identifiers to which this agent may delegate work.
     *
     * Defaults to `[]`. Entries must be unique. Delegation additionally
     * requires `allow_delegation` and respects `max_delegation_depth` on
     * {@link agentSafetySchema}.
     */
    delegates_to: z.array(identifierSchema).default([]),

    /**
     * Optional human-readable summary of the agent's purpose.
     *
     * When present, must be non-empty after trim.
     */
    description: z.string().trim().min(1).optional(),

    /**
     * Per-run limits (iteration count and wall-clock timeout).
     *
     * See {@link agentExecutionSchema}.
     */
    execution: agentExecutionSchema,

    /**
     * Stable agent identifier used for registration and cross-agent
     * references (including `delegates_to` targets).
     */
    id: identifierSchema,

    /**
     * Default language-model settings for this agent.
     *
     * See {@link agentLLMSchema}.
     */
    llm: agentLLMSchema,

    /**
     * Human-readable display name (non-empty after trim).
     */
    name: z.string().trim().min(1),

    /**
     * Path to the system-prompt file, relative to the manifest directory.
     *
     * The loader reads this file and supplies the contents as
     * {@link AgentDescriptor.systemPrompt}; the path itself is not retained
     * on {@link AgentDefinition}.
     */
    prompt_file: z.string().trim().min(1),

    /**
     * Responsibility assigned to the agent.
     *
     * - {@link AgentRole.Main} — primary / orchestrating agent
     * - {@link AgentRole.Specialist} — focused subordinate agent
     */
    role: z.enum([AgentRole.Main, AgentRole.Specialist]),

    /**
     * Kernel-enforced permissions and delegation limits.
     *
     * See {@link agentSafetySchema}.
     */
    safety: agentSafetySchema,

    /**
     * Skill identifiers available to this agent.
     *
     * Defaults to `[]`. Entries must be unique. Effective use also requires
     * `allow_skill_use` on {@link agentSafetySchema}.
     */
    skills: z.array(identifierSchema).default([]),
  })
  .strict()
  .superRefine((manifest, context) => {
    validateUniqueValues(manifest.capabilities, 'capabilities', context)
    validateUniqueValues(manifest.delegates_to, 'delegates_to', context)
    validateUniqueValues(manifest.skills, 'skills', context)
  })

/**
 * Parsed agent configuration from a validated manifest.
 *
 * Inferred from {@link agentSchema}. Prefer {@link AgentDefinition} (via
 * {@link AgentDefinition.from}) in runtime code after the prompt file is
 * resolved and field names are normalized.
 */
export type AgentManifest = z.infer<typeof agentSchema>
