// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Database, OrganizationIntegration } from "@/infraestructure/database";
import { Injectable } from "@nestjs/common";
import { IntegrationStatus } from "@prisma/client";

/**
 * Repository responsible for persisting and querying organization integration entities.
 */
@Injectable()
export class OrganizationIntegrationRepository {
    // MARK: - Constructor

    /**
     * Creates a new {@link OrganizationIntegrationRepository}.
     *
     * @param database - The database client used to perform organization integration operations.
     * Injected at runtime to support inversion of control and enable testability.
     */
    constructor(private readonly database: Database) { }

    // MARK: - Instance methods

    /**
     * Creates a new organization integration.
     *
     * @param organizationId - The id of the organization.
     * @param integrationId - The id of the integration.
     * @param name - The name of the integration.
     * @param status - The status of the integration.
     * @param config - The config of the integration.
     * @param secretRef - The secret reference of the integration.
     * @returns The created {@link OrganizationIntegration} entity.
     */
    async create(
        organizationId: string,
        integrationId: string,
        name: string,
        status: IntegrationStatus,
        config: Record<string, any>,
        secretRef: string,
    ): Promise<OrganizationIntegration> {
        return this.database.organizationIntegration.create(
            {
                data: {
                    organizationId,
                    integrationId,
                    name,
                    version: '1.0.0',
                    status,
                    config,
                    secretRef,
                    createdAt: new Date(),
                }
            },
        )
    }
}