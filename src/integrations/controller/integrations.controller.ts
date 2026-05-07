// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IntegrationConnectionService } from "../service/integration-connection.service";
import {
    CreateIntegrationParametersDto,
} from "../domain/dtos/parameters/create-integration.parameters.dto";
import {
    Body,
    Controller,
    HttpCode,
    Post,
} from "@nestjs/common";

/**
 * HTTP controller responsible for handling integration-related requests.
 *
 * This controller acts as the transport-layer entry point for integration
 * operations and delegates all business logic to the
 * {@link IntegrationConnectionService}.
 */
@Controller('integrations')
export class IntegrationsController {
    // MARK: - Constructor

    /**
     * Creates a new {@link IntegrationsController}.
     *
     * @param integrationConnectionService - Application service responsible for
     * orchestrating integration-related operations such as creation.
     */
    constructor(
        private readonly integrationConnectionService: IntegrationConnectionService,
    ) { }

    // MARK: - Instance methods

    /**
     * Creates an integration.
     *
     * @param parameters - The parameters for the integration creation.
     * @returns The result of the integration creation.
     */
    @HttpCode(204)
    @Post('create')
    async create(@Body() parameters: CreateIntegrationParametersDto): Promise<void> {
        await this.integrationConnectionService.createIntegration(parameters);
    }
}
