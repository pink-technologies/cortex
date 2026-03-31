// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common';
import { AGENT, type Agent, type AgentContext } from '@/agents';
import { DECISION_EXECUTOR, type DecisionExecutor } from './executor/decision-executor';
import { KernelResult } from './result/kernel-result';
import { ExecutionInput } from '@/shared/types';
import { randomUUID } from 'crypto';

/**
 * Kernel “brain” service: single entry for processing {@link KernelInput}.
 *
 * Responsibilities:
 * - resolve the agent ID (from intent or default)
 * - select the origin adapter via {@link KernelOriginAdapterRegistry}
 * - delegate execution to the adapter (chat, webhook, etc.)
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

    async process(input: ExecutionInput): Promise<KernelResult> {
        const executionId = randomUUID();
        const context: AgentContext = {
            message: input.message,
            executionId,
        };

        const decision = await this.agent.decide(context);

        return await this.decisionExecutor.execute(decision, context);
    }
}
