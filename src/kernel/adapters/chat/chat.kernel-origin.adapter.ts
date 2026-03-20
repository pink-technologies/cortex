import { AgentHandleResult, KernelInput } from "@/kernel/dto";
import { KernelOriginAdapter } from "../kernel-origin-adapter.interface";
import { SourceType } from "@/kernel/types/source-type";
import { Injectable } from "@nestjs/common";
import { AgentRunService } from "@/agents/service";
import { KernelChatRequiredIdError } from "@/kernel/service/error/kernel.error";

/**
 * Adapter for chat origin.
 *
 * This adapter is used to handle chat inputs, tying the agent run to a conversation via {@link KernelContext.chatId}.
 *
 * @example
 * ```typescript
 * const adapter = new ChatKernelOriginAdapter(agentRunService);
 * const result = await adapter.handle(input, agentId);
 * ```
 */
@Injectable()
export class ChatKernelOriginAdapter implements KernelOriginAdapter {
    // MARK: - Properties

    /**
     * The origin of the adapter.
     */
    readonly origin = SourceType.CHAT;

    // MARK: - Constructor

    /**
     * Creates a new {@link ChatKernelOriginAdapter}.
     *
     * @param agentRunService - The agent run service.
     */
    constructor(private readonly agentRunService: AgentRunService) { }

    // MARK: - Instance methods

    /**
     * Handles a chat input.
     *
     * @param input - The input to handle.
     * @param agentId - The agent ID to handle the input for.
     * @returns The result of the handle.
     */
    async handle(input: KernelInput, agentId: string): Promise<AgentHandleResult> {
        if (!input.context.chatId) throw new KernelChatRequiredIdError();

        const run = await this.agentRunService.run(agentId, input.context.chatId);

        return {
            source: this.origin,
            agentId: agentId,
            run: run,
        };
    }
}