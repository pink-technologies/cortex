// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IntegrationProvider } from "../../integration-provider.adapter";
import {
    IsEnum,
    IsObject,
} from "class-validator";

/**
 * Data Transfer Object representing a parameters for creating an integration.
 */
export class CreateIntegrationParametersDto {
    /**
     * The provider of the integration.
     */
    @IsEnum(IntegrationProvider)
    provider: IntegrationProvider;

    /**
     * The input for the integration.
     */
    @IsObject()
    input: Record<string, unknown>;
}
