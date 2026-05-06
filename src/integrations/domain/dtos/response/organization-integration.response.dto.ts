// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { OrganizationIntegration } from "@/infraestructure/database";
import { IntegrationStatus } from "@prisma/client";


/**
 * Data Transfer Object representing a organization integration response with
 * null values normalized to empty strings where appropriate.
 */
export class OrganizationIntegrationResponseDto {
    /**
     * Unique identifier of the organization integration.
     */
    readonly id: string;

    /**
     * The id of the organization.
     */
    readonly organizationId: string;

    /**
     * The id of the integration.
     */
    readonly integrationId: string;

    /**
     * The name of the organization integration.
     */
    readonly name: string;

    /**
     * The status of the organization integration.
     */
    readonly status: IntegrationStatus;

    /**
     * ISO timestamp when the organization integration was created.
     */
    readonly createdAt: string;

    /**
     * The organization integration's configuration.
     */
    readonly config: Record<string, any>;

    /**
     * ISO timestamp when the organization integration was last updated.
     */
    readonly updatedAt?: string | null;

    // MARK: - Static methods

    /**
     * Creates a {@link OrganizationIntegrationResponseDto} from a domain organization integration entity.
     */
    static from(organizationIntegration: OrganizationIntegration): OrganizationIntegrationResponseDto {
        return {
            id: organizationIntegration.id,
            organizationId: organizationIntegration.organizationId,
            integrationId: organizationIntegration.integrationId,
            name: organizationIntegration.name,
            status: organizationIntegration.status,
            createdAt: organizationIntegration.createdAt.toISOString(),
            config: organizationIntegration.config as Record<string, any>,
            updatedAt: organizationIntegration.updatedAt?.toISOString() ?? null,
        };
    }
}
