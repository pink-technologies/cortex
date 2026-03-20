// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable, Optional } from '@nestjs/common';
import { WebhookProviderNotFoundError } from '@/kernel/service/error/kernel.error';
import {
    WEBHOOK_PROVIDER_HANDLER,
    type WebhookProviderHandler,
} from './webhook-provider-handler.interface';

/**
 * Resolves a {@link WebhookProviderHandler} by provider name (e.g. github, jira, slack).
 *
 * Built at application bootstrap from all handlers registered with
 * {@link WEBHOOK_PROVIDER_HANDLER} (`multi: true`).
 */
@Injectable()
export class WebhookProviderHandlerRegistry {
    private readonly byName: Map<string, WebhookProviderHandler>;

    // MARK: - Constructor

    /**
     * Creates a new {@link WebhookProviderHandlerRegistry}.
     *
     * @param handlers - Handlers registered with {@link WEBHOOK_PROVIDER_HANDLER}
     * (`multi: true`); omitted when none are registered yet.
     */
    constructor(
        @Optional()
        @Inject(WEBHOOK_PROVIDER_HANDLER)
        handlers: WebhookProviderHandler[] | undefined,
    ) {
        this.byName = new Map(
            (handlers ?? []).map((handler) => [handler.name, handler]),
        );
    }

    /**
     * Gets a webhook provider handler by provider name.
     *
     * @param providerName - Provider name from {@link KernelContext.externalProvider}.
     * @returns The webhook provider handler.
     * @throws WebhookProviderNotFoundError when no handler is registered for the provider.
     */
    get(providerName: string): WebhookProviderHandler {
        const handler = this.byName.get(providerName);

        if (!handler) throw new WebhookProviderNotFoundError();

        return handler;
    }
}
