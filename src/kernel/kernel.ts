// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DECISION_EXECUTOR, type DecisionExecutor } from './executor/decision-executor';
import { KernelResult } from './result/kernel-result';
import { ExecutionContext, ExecutionInput } from '@/shared/types';
import { ConversationMessage } from '@/shared/types/input/execution-input';
import { CapabilityDescriptionResolverService } from '@/capabilities';
import {
    AGENT,
    type Agent,
    type AgentContext,
} from '@/agents';

/**
 * Kernel “brain” service: single entry for processing {@link ExecutionInput}.
 *
 * Responsibilities:
 * - resolve the acting agent
 * - resolve live capability descriptions so the agent's prompt is built with
 *   the current contract (no hardcoded measures, channels, etc.)
 * - delegate decision execution to the configured {@link DecisionExecutor}
 */
@Injectable()
export class Kernel {
    // MARK: - Constructor

    /**
     * Creates a new {@link Kernel}.
     *
     * @param agent - The main assistant agent for the kernel.
     * @param decisionExecutor - The decision executor for the kernel.
     * @param capabilityDescriptionResolver - Resolves live capability
     *   descriptions for the acting agent before invoking {@link Agent.decide}.
     */
    constructor(
        @Inject(AGENT)
        private readonly agent: Agent,
        @Inject(DECISION_EXECUTOR)
        private readonly decisionExecutor: DecisionExecutor,
        private readonly capabilityDescriptionResolver: CapabilityDescriptionResolverService,
    ) { }

    // MARK: - Instance methods

    /**
     * Processes an {@link ExecutionInput} through the kernel pipeline.
     *
     * @param input - The {@link ExecutionInput} to process.
     *
     * @returns A promise that resolves to a {@link KernelResult}.
     */
    async process(input: ExecutionInput): Promise<KernelResult> {
        const executionId = randomUUID();
        const conversationHistory: ConversationMessage[] = [
            ...(input.conversationHistory ?? []),
            { role: 'user', content: input.message },
        ];

        const executionContext: ExecutionContext = {
            executionId,
            message: input.message,
            conversationHistory,
            sessionId: input.sessionId,
            userId: input.userId,
            allowedCapabilityIds: this.agent.descriptor.capabilities,
            allowedSkillIds: this.agent.descriptor.skills,
            agent: this.agent,
        };

        const availableCapabilities = await this.capabilityDescriptionResolver.resolve(
            this.agent.descriptor.capabilities,
            executionContext,
        );

        const agentContext: AgentContext = {
            executionId,
            message: input.message,
            conversationHistory,
            availableCapabilities,
        };

        const decisions = await this.agent.decide(agentContext);

        return this.decisionExecutor.execute(decisions, executionContext);
    }
}
