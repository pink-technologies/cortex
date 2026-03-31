// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod';
import { AgentDecisionType } from '@/agents/agent';

/**
 * Runtime validation for agent decisions (e.g. JSON from an LLM `completeStructured` call).
 * Each branch matches exactly one variant of the tagged union (no mixed or partial fields).
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
]);

