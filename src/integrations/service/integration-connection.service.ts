// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AwsSecretStorageService } from "@/infraestructure/storage/secret/aws-secret-storage.service";
import { IntegrationAdapterRegistry } from "../registry/integration-adapter.registry";
import {
    CreateIntegrationParametersDto
} from "../domain/dtos/parameters/create-integration.parameters.dto"

/**
 * Service responsible for creating an integration.
 */
@Injectable()
export class IntegrationConnectionService {
    // MARK: - Private properties

    private readonly registry: IntegrationAdapterRegistry;
    private readonly storage: AwsSecretStorageService;

    // MARK: - Constructor

    /**
     * Creates a new {@link IntegrationConnectionService}.
     *
     * @param registry - The registry of integration adapters.
     * @param storage - The secret storage service.
     */
    constructor(registry: IntegrationAdapterRegistry, storage: AwsSecretStorageService) {
        this.registry = registry;
        this.storage = storage;
    }

    // MARK: - Instance methods

    /**
     * Creates an integration.
     *
     * @param parameters - The parameters for the integration creation.
     * @returns The created integration.
     */
    async createIntegration(parameters: CreateIntegrationParametersDto): Promise<void> {
        const adapter = this.registry.get(parameters.provider);

        adapter.validateInput(parameters.input);

        await adapter.testConnection(parameters.input);

        const namespace = `integration-${parameters.provider}-${randomUUID()}`;

        await this.storage.write<Record<string, unknown>>(parameters.input, namespace);
    }
}
