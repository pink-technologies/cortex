// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentsRepository } from '@/agents/repositories';
import { Injectable } from '@nestjs/common';
import { KernelOriginAdapterRegistry } from '../adapters/kernel-origin-adapter.registry';
import { OrchestratorService } from '@/agents/service';
import { KernelNoAgentsError } from './error/kernel.error';
import type {
    AgentHandleResult,
    KernelContext,
    KernelInput,
} from '../dto';

/**
 * Service responsible for handling kernel ingress requests.
 *
 * Responsibilities:
 * - resolve the agent ID (from intent or default)
 * - select the origin adapter via {@link KernelOriginAdapterRegistry}
 * - delegate execution to the adapter (chat, webhook, etc.)
 */
@Injectable()
export class KernelService {
    // MARK: - Constructor

    /**
     * Creates a new {@link KernelService}.
     *
     * @param agentsRepository - The agents repository.
     * @param orchestrator - The orchestrator service.
     * @param originAdapterRegistry - The registry of origin adapters (chat, webhook, etc.).
     */
    constructor(
        private readonly agentsRepository: AgentsRepository,
        private readonly orchestrator: OrchestratorService,
        private readonly originAdapterRegistry: KernelOriginAdapterRegistry,
    ) { }

    // MARK: - Instance methods

    /**
     * Processes a kernel input.
     *
     * Resolves the agent ID, selects the origin adapter from the registry by
     * {@link KernelContext.origin}, and delegates to the adapter.
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
        const { context } = input;

        const agentId = await this.resolveAgentId(context);

        const adapter = this.originAdapterRegistry.get(context.origin);

        return await adapter.handle(input, agentId);
    }

    // MARK: - Private methods

    private async resolveAgentId(context: KernelContext): Promise<string> {
        if (context.intent?.trim()) {
            const agent = await this.orchestrator.resolveAgentByIntent(context.intent.trim());

            return agent.id;
        }

        const first = await this.agentsRepository.retrieveFirst();
        if (!first) throw new KernelNoAgentsError();

        return first.id;
    }
}
