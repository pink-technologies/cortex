// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentsRepository } from '@/agents/repositories';
import { AgentRunService } from '@/agents/service/agent-run/agent-run.service';
import { OrchestratorService } from '@/agents/service/orchestrator/agents-orchestrator.service';
import type {
    AgentHandleResult,
    AgentWebhookResponse,
    ContextPayload,
    KernelHandleParameters,
} from '../dto';
import {
    BadRequestException,
    Injectable,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';

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
     * @param orchestrator - The orchestrator service.
     * @param agentsRepository - The agents repository.
     * @param agentRun - The agent run service.
     */
    constructor(
        private readonly orchestrator: OrchestratorService,
        private readonly agentsRepository: AgentsRepository,
        private readonly agentRun: AgentRunService,
    ) { }

    // MARK: - Instance methods

    /**
     * Handles a kernel ingress request.
     * @param parameters - The parameters for the kernel ingress request.
     * @returns The result of the kernel ingress request.
     */
    async handle(parameters: KernelHandleParameters): Promise<AgentHandleResult> {
        const { message, context } = parameters;

        const agentId = await this.resolveAgentId(context);

        if (context.source === 'chat') {
            const run = await this.agentRun.run(agentId, context.chatId ?? '');

            return {
                source: context.source,
                agentId,
                run,
            };
        }

        if (context.source === 'webhook') {
            return {
                source: context.source,
                agentId,
                external: this.handleWebhookIngress(agentId, message, context),
            };
        }

        throw new BadRequestException(
            `Unsupported kernel ingress source: ${String(context.source)}`,
        );
    }

    // MARK: - Private methods

    private handleWebhookIngress(
        _agentId: string,
        _message: string,
        _context: ContextPayload,
    ): AgentWebhookResponse {
        // TODO: Implement webhook ingress handling.
        return { message: 'ok' };
    }

    private async resolveAgentId(context: ContextPayload): Promise<string> {
        if (context.intent?.trim()) {
            const agent = await this.orchestrator.resolveAgentByIntent(
                context.intent.trim(),
            );

            return agent.id;
        }

        const agents = await this.agentsRepository.retrieve();

        return agents[0].id;
    }
}
