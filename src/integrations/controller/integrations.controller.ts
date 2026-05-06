// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Body, Controller, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { IntegrationConnectionService } from "../service/integration-connection.service";
import { OrganizationIntegrationResponseDto } from "../domain/dtos/response/organization-integration.response.dto";
import {
    CreateOrganizationIntegrationParametersDto
} from "../domain/dtos/parameters/connect/create-organization-integration.parameters.dto";

/**
 * HTTP controller responsible for handling user-related requests.
 *
 * This controller acts as the transport-layer entry point for authentication
 * operations and delegates all business logic to the
 * {@link UserService}.
 */
@Controller('integrations')
export class IntegrationsController {
    // MARK: - Constructor

    /**
     * Creates a new {@link UserController}.
     *
     * @param userService - Application service responsible for
     * orchestrating user-related operations such as lookup and updates.
     */
    constructor(
        private readonly integrationConnectionService: IntegrationConnectionService,
    ) { }

    // MARK: - Instance methods

    /**
     * Retrieves the current user's profile.
     *
     * @param req - The request object.
     * @param parameters - The parameters for the integration connection.
     * @returns The connected integration entity.
     */
    @HttpCode(200)
    @Post('connect')
    async connect(@Body() parameters: CreateOrganizationIntegrationParametersDto): Promise<OrganizationIntegrationResponseDto> {
        return this.integrationConnectionService.connectIntegration(parameters);
    }
}
