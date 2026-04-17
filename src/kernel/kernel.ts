// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common';
import { DECISION_EXECUTOR, type DecisionExecutor } from './executor/decision-executor';
import { KernelResult } from './result/kernel-result';
import { randomUUID } from 'crypto';
import {
    AGENT,
    type Agent,
    type AgentContext,
} from '@/agents';
import type {
    ConversationMessage,
    ExecutionInput,
} from '@/shared/types';

/**
 * Kernel “brain” service: single entry for processing {@link KernelInput}.
 *
 * Responsibilities:
 * - resolve the agent ID (from intent or default)
 * - select the origin adapter via {@link KernelOriginAdapterRegistry}
 * - delegate execution to the adapter (chat, webhook, etc.)
 *
 * Invokes {@link Agent.decide} once per {@link Kernel.process} call; {@link DecisionExecutor}
 * runs the returned decisions (including nested **delegate** work) until a terminal {@link KernelResult}.
 */
@Injectable()
export class Kernel {
    // MARK: - Constructor

    /**
     * Creates a new {@link Kernel}.
     *
     * @param agent - The main assistant agent for the kernel. 
     * @param decisionExecutor - The decision executor for the kernel.
     */
    constructor(
        @Inject(AGENT)
        private readonly agent: Agent,
        @Inject(DECISION_EXECUTOR)
        private readonly decisionExecutor: DecisionExecutor,
    ) { }

    // MARK: - Instance methods

    /**
     * Processes the input and returns the result.
     *
     * @param input - The input to process.
     * @returns The result of the process.
     */
    async process(input: ExecutionInput): Promise<KernelResult> {
        const executionId = randomUUID();
        const conversationHistory: ConversationMessage[] = [
            ...(input.conversationHistory ?? []),
        ];

        const agentContext: AgentContext = {
            message: input.message,
            conversationHistory,
            executionId,
        };

        const decisions = await this.agent.decide(agentContext);

        return this.decisionExecutor.execute(decisions, {
            executionId,
            message: input.message,
            conversationHistory,
            sessionId: input.sessionId,
            userId: input.userId,
            allowedCapabilityIds: this.agent.descriptor.capabilities,
            allowedSkillIds: this.agent.descriptor.skills,
            agentId: this.agent.id,
        });
    }
}


