// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { KernelInput } from "@/kernel/dto/input/kernel_input";
import type { AgentWebhookResponse } from "@/kernel/dto/response/kernel-handle.result";

/**
 * Injection token for registering webhook provider handlers with Nest multi-provider:
 * `{ provide: WEBHOOK_PROVIDER_HANDLER, useClass: XHandler, multi: true }`.
 */
export const WEBHOOK_PROVIDER_HANDLER = Symbol('WEBHOOK_PROVIDER_HANDLER');

/**
 * Interface for a webhook provider.
 *
 * The provider is responsible for handling a webhook input and returning a result.
 */
export interface WebhookProviderHandler {
    /**
     * The name of the provider.
     */
    readonly name: string;

    /**
     * Handles a webhook input.
     *
     * @param input - The input to handle.
     * @param agentId - The agent ID to handle the input for.
     * @returns The result of the handle.
     */
    handle(input: KernelInput, agentId: string): Promise<AgentWebhookResponse>;
}