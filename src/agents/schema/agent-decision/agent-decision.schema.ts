// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod';
import { AgentDecisionType } from '@/agents/agent';
import { capabilityInputSchema } from '@/capabilities/schema/input/capability-input.schema';

/**
 * Runtime validation for agent decisions (e.g. JSON from an LLM `completeStructured` call).
 *
 * Branches (discriminator `type`):
 * - `delegate` — `agentId`, optional `reason`
 * - `respond` — `response` (plain string)
 * - `use-skill` — `skillId`, `input`
 * - `use-capability` — `capabilityId`, `input`, `userMessage`
 * - `suggest-capability` — `message`, `capabilities`
 *
 * Each branch matches exactly one variant of the `AgentDecision` tagged union in `agent.ts`.
 */
export const agentDecisionSchema = z.discriminatedUnion('type', [
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
        type: z.literal(AgentDecisionType.UseSkill),
        skillId: z.string(),
        input: z.record(z.string(), z.unknown()),
    }),
    z.object({
        type: z.literal(AgentDecisionType.UseCapability),
        capabilityId: z.string(),
        input: z.record(z.string(), z.unknown()),
        userMessage: z.string().min(1),
    }),
    z.object({
        type: z.literal(AgentDecisionType.SuggestCapability),
        message: z.string(),
        capabilities: z.array(capabilityInputSchema),
    }),
]);

