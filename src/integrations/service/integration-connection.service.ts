// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AwsSecretsManagerAdapter } from "@/infraestructure/secret/manager/secret-manager-adapter";
import { IntegrationAdapterRegistry } from "../registry/integration-adapter.registry";
import { IntegrationStatus } from "@prisma/client";
import { OrganizationIntegrationRepository } from "../domain/repository/organization-integration/organization-integration.repository";
import { OrganizationIntegrationResponseDto } from "../domain/dtos/response/organization-integration.response.dto";
import {
    CreateOrganizationIntegrationParametersDto
} from "../domain/dtos/parameters/connect/create-organization-integration.parameters.dto"
import { Injectable } from "@nestjs/common";

/**
 * Service responsible for connecting an integration to an organization.
 */
@Injectable()
export class IntegrationConnectionService {
    // MARK: - Private properties

    private readonly registry: IntegrationAdapterRegistry;
    private readonly repository: OrganizationIntegrationRepository;
    private readonly secretManager: AwsSecretsManagerAdapter;

    // MARK: - Constructor

    /**
     * Creates a new {@link IntegrationConnectionService}.
     *
     * @param registry - The registry of integration adapters.
     * @param repository - The repository of integrations.
     * @param secretManager - The secret manager.
     */
    constructor(
        registry: IntegrationAdapterRegistry,
        repository: OrganizationIntegrationRepository,
        secretManager: AwsSecretsManagerAdapter,
    ) {
        this.registry = registry;
        this.repository = repository;
        this.secretManager = secretManager;
    }

    // MARK: - Instance methods

    /**
     * Connects an integration to an organization.
     *
     * @param parameters - The parameters for the integration connection.
     * @returns The connected integration entity.
     */
    async connectIntegration(parameters: CreateOrganizationIntegrationParametersDto): Promise<OrganizationIntegrationResponseDto> {
        const adapter = this.registry.get(parameters.provider);

        adapter.validateInput(parameters.input);

        await adapter.testConnection(parameters.input);

        const payload = await this.secretManager.create({
            name: `integration-${parameters.organizationId}-${parameters.integrationId}-${parameters.provider}`,
            value: parameters.input,
        });

        const organizationIntegration = await this.repository.create(
            parameters.organizationId,
            parameters.integrationId,
            parameters.name,
            IntegrationStatus.CONNECTED,
            parameters.input,
            payload.secretRef,
        );

        console.log(organizationIntegration);

        return OrganizationIntegrationResponseDto.from(organizationIntegration);
    }
}
