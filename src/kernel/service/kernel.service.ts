// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentsRepository } from '@/agents/repositories';
import { AgentRunService } from '@/agents/service/agent-run/agent-run.service';
import { OrchestratorService } from '@/agents/service/orchestrator/agents-orchestrator.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import type {
    AgentHandleResult,
    AgentWebhookResponse,
    KernelContext,
    KernelInput,
} from '../dto';

/**
 * Service responsible for handling kernel ingress requests.
 *
 * Responsibilities:
 * - resolve the agent ID based on the context.
 * - run the agent on the chat if the context is a chat.
 * - handle the webhook ingress if the context is a webhook.
 */
@Injectable()
export class KernelService {
    // MARK: - Constructor

    /**
     * Creates a new {@link KernelService}.
     * 
     * @param agentsRepository - The agents repository.
     * @param agentRun - The agent run service.
     * @param orchestrator - The orchestrator service.
     */
    constructor(
        private readonly agentsRepository: AgentsRepository,
        private readonly agentRun: AgentRunService,
        private readonly orchestrator: OrchestratorService,
    ) {}

    // MARK: - Instance methods

    /**
     * Processes a kernel input.
     *
     * This method performs the full kernel pipeline:
     * - normalizes the input
     * - validates source-specific invariants
     * - gathers kernel state
     * - decides which agent and strategy to use
     * - executes the decision
     * - evaluates the outcome
     *
     * @param input - The input to process.
     * @returns The result of the resolved execution path.
     */
    async process(input: KernelInput): Promise<AgentHandleResult> {
        /*        
        -> validate
        -> classify
        -> resolve agent
        -> choose execution strategy
        -> execute
        -> post-process result
        */
        const { payload, context } = input;

        const agentId = await this.resolveAgentId(context);

        if (context.origin === 'chat') {
            const run = await this.agentRun.run(agentId, context.chatId ?? '');

            return { agentId, run, source: context.origin };
        }

        if (context.origin === 'webhook') {
            return {
                source: context.origin,
                agentId,
                external: this.handleWebhookIngress(agentId, payload, context),
            };
        }

        throw new BadRequestException(`Unsupported kernel ingress source: ${context.origin}`);
    }

    // MARK: - Private methods

    private handleWebhookIngress(
        _agentId: string,
        _payload: string,
        _context: KernelContext,
    ): AgentWebhookResponse {
        // TODO: Implement webhook ingress handling.
        return { message: 'ok' };
    }

    private async resolveAgentId(context: KernelContext): Promise<string> {
        if (context.intent?.trim()) {
            const agent = await this.orchestrator.resolveAgentByIntent(context.intent.trim());

            return agent.id;
        }

        const agents = await this.agentsRepository.retrieve();

        return agents[0].id;
    }
}
