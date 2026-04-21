// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod';
import { AgentDecisionType } from '@/agents/agent';
import { capabilityInputSchema } from '@/capabilities/schema/input/capability-input.schema';
import { skillInputSchema } from '@/skills/schema/input/skill-input.schema';

/**
 * Runtime validation for agent decisions (e.g. JSON from an LLM `completeStructured` call).
 *
 * Branches (discriminator `type`):
 * - `delegate` — `agentId`, optional `reason`
 * - `respond` — `response` (plain string)
 * - `suggest-capability` — `message`, `capabilities`
 * - `suggest-skill` — `message`, `skills`
 * - `suggest-options` — `message`, `capabilities`, `skills` (both non-empty)
 * - `use-capability` — `capabilityId`, `input`, `userMessage`
 * - `use-skill` — `skillId`, `input`
 *
 * Each branch matches exactly one variant of the `AgentDecision` tagged union in `agent.ts`.
 */
const agentDecisionSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal(AgentDecisionType.Delegate),
        agentId: z.string(),
        reason: z.string().optional(),
    }),
    z.object({
        type: z.literal(AgentDecisionType.Respond),
        response: z.string(),
    }),
    z.object({
        type: z.literal(AgentDecisionType.SuggestCapability),
        message: z.string(),
        capabilities: z.array(capabilityInputSchema),
    }),
    z.object({
        type: z.literal(AgentDecisionType.SuggestSkill),
        message: z.string(),
        skills: z.array(skillInputSchema),
    }),
    z.object({
        type: z.literal(AgentDecisionType.SuggestOptions),
        message: z.string(),
        capabilities: z.array(capabilityInputSchema).min(1),
        skills: z.array(skillInputSchema).min(1),
    }),
    z.object({
        type: z.literal(AgentDecisionType.UseCapability),
        capabilityId: z.string(),
        input: z.record(z.string(), z.unknown()),
        userMessage: z.string().min(1),
    }),
    z.object({
        type: z.literal(AgentDecisionType.UseSkill),
        skillId: z.string(),
        input: z.record(z.string(), z.unknown()),
    }),
]);

/**
 * One or more {@link agentDecisionSchema} values in execution order.
 *
 * Accepts either a JSON array of decisions or a single decision object (wrapped to a one-element array).
 */
export const agentDecisionsSchema = z
    .union([
        z.array(agentDecisionSchema).min(1).max(32),
        agentDecisionSchema,
    ])
    .transform((v) => (Array.isArray(v) ? v : [v]));