// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IntegrationProvider } from "../domain/integration-provider.adapter";
import { Injectable } from "@nestjs/common";
import { IntegrationProviderAdapter } from "../domain/integration-provider.adapter";

/**
 * Registry of integration adapters.
 */
@Injectable()
export class IntegrationAdapterRegistry {
    // MARK: - Properties

    /**
     * The registry of integration adapters.
     */
    private readonly adaptersByProvider: Map<IntegrationProvider, IntegrationProviderAdapter> = new Map();

    // MARK: - Constructor

    /**
     * Creates a new {@link IntegrationAdapterRegistry}.
     * 
     * @param adapters - The adapters to register.
     */
    constructor(adapters: IntegrationProviderAdapter[]) {
        this.adaptersByProvider = new Map(
            adapters.map(adapter => [adapter.provider, adapter]));
    }

    // MARK: - Instance methods

    /**
     * Gets an integration adapter by provider.
     *
     * @param provider - The provider of the integration.
     * @returns The adapter for the integration.
     */
    get(provider: IntegrationProvider): IntegrationProviderAdapter {
        const adapter = this.adaptersByProvider.get(provider);

        if (!adapter) {
            throw new Error(`Adapter for provider ${provider} not found`);
        }

        return adapter;
    }
}
