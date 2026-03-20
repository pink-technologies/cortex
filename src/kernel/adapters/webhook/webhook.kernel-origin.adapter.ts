import { AgentHandleResult, KernelInput } from "@/kernel/dto";
import { WebhookProviderContextError } from "@/kernel/service/error/kernel.error";
import { KernelOriginAdapter } from "../kernel-origin-adapter.interface";
import { SourceType } from "@/kernel/types/source-type";
import { Injectable } from "@nestjs/common";
import { WebhookProviderHandlerRegistry } from "./providers/webhook-provider-handler.registry";

/**
 * Adapter for webhook origin.
 * 
 * This adapter is used to handle webhook inputs.
 * 
 * @example
 * ```typescript
 * const adapter = new WebhookKernelOriginAdapter();
 * const result = await adapter.handle(input, agentId);
 * ```
 */
@Injectable()
export class WebhookKernelOriginAdapter implements KernelOriginAdapter {
    // MARK: - Properties

    /**
     * The origin of the adapter.
     */
    readonly origin = SourceType.WEBHOOK;

    // MARK: - Constructor

    /**
     * Creates a new {@link WebhookKernelOriginAdapter}.
     *
     * @param webhookProviderHandlerRegistry - The registry of webhook provider handlers.
     */
    constructor(
        private readonly webhookProviderHandlerRegistry: WebhookProviderHandlerRegistry,
    ) { }

    /**
     * Handles a webhook input.
     *
     * @param input - The input to handle.
     * @param agentId - The agent ID to handle the input for.
     * @returns The result of the handle.
     */
    async handle(input: KernelInput, agentId: string): Promise<AgentHandleResult> {
        const { externalProvider } = input.context;

        if (!externalProvider?.trim()) throw new WebhookProviderContextError();

        const handler = this.webhookProviderHandlerRegistry.get(externalProvider.trim());
        const external = await handler.handle(input, agentId);

        return {
            source: this.origin,
            agentId,
            external,
        };
    }
}