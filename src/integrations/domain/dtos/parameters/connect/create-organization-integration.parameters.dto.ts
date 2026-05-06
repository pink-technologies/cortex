// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IntegrationProvider } from "@prisma/client";
import {
    IsEnum,
    IsNotEmpty,
    IsObject,
    IsString,
    IsUUID,
} from "class-validator";

/**
 * Data Transfer Object representing a parameters for creating an organization integration.
 */
export class CreateOrganizationIntegrationParametersDto {
    /**
     * The id of the organization.
     */
    @IsUUID()
    organizationId: string;

    /**
     * The provider of the integration.
     */
    @IsEnum(IntegrationProvider)
    provider: IntegrationProvider;

    /**
     * The id of the integration.
     */
    @IsUUID()
    integrationId: string;

    /**
     * The name of the integration.
     */
    @IsString()
    @IsNotEmpty()
    name: string;

    /**
     * The input for the integration.
     */
    @IsObject()
    input: Record<string, unknown>;
}
