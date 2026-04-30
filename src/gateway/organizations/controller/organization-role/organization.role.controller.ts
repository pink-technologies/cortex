// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { OrganizationRole } from '@/infraestructure/database';
import { OrganizationExceptionFilter } from '../../filter/exception.filter';
import { OrganizationRolesService } from '../../services/roles/organization.roles.service';
import { AuthenticatorGuard } from '@/gateway/authentication/guards/authenticator-guard';
import {
  Controller,
  Get,
  HttpCode,
  Param,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

/**
 * HTTP controller responsible for handling authentication-related requests.
 *
 * This controller acts as the transport-layer entry point for authentication
 * operations and delegates all business logic to the
 * {@link AuthenticationService}.
 */
@Controller('organizations/roles')
@UseFilters(OrganizationExceptionFilter)
export class OrganizationRoleController {
  // MARK: - Constructor

  /**
   * Creates a new {@link OrganizationRoleController}.
   *
   * @param organizationRoleService - Application service responsible for
   * managing organization roles.
   */
  constructor(
    private readonly organizationRoleService: OrganizationRolesService,
  ) {}

  // MARK: - Instance methods

  /**
   * Retrieves an organization role by its unique identifier.
   *
   * This endpoint returns a single organization role based on the provided `id`.
   * The identifier must correspond to an existing role in the system.
   *
   * Security considerations:
   * - Access to this endpoint should be restricted to authenticated users.
   * - Additional authorization checks may be required depending on the context
   *   (e.g. ensuring the role belongs to the user's organization).
   *
   * A successful operation returns **200 OK** with the role entity.
   *
   * @param id - The unique identifier of the organization role.
   *
   * @returns The {@link OrganizationRole} associated with the given identifier.
   *
   * @throws HttpException If the operation fails due to:
   * - The role not being found
   * - Invalid identifier format
   * - Unauthorized or forbidden access
   */
  @UseGuards(AuthenticatorGuard)
  @HttpCode(200)
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<OrganizationRole> {
    const user = (req as any).user;

    return await this.organizationRoleService.findById(id, user.id);
  }

  /**
   * Retrieves all organization roles associated with the authenticated user.
   *
   * This endpoint returns the list of roles that belong to the currently
   * authenticated user. The user is resolved from the request context,
   * typically populated by an authentication middleware or guard.
   *
   * Security considerations:
   * - Requires a valid authenticated session or token.
   * - The user context is extracted from the request object.
   * - No sensitive data beyond authorized roles is exposed.
   *
   * A successful response returns **200 OK** with a list of organization roles.
   *
   * @param req The incoming HTTP request containing the authenticated user context.
   *
   * @returns A list of organization roles associated with the user.
   *
   * @throws HttpException If retrieval fails due to:
   * - Unauthorized or missing authentication
   * - Internal server errors
   * - Upstream service failures
   */
  @UseGuards(AuthenticatorGuard)
  @HttpCode(200)
  @Get()
  async retrieve(@Req() req: Request): Promise<OrganizationRole[]> {
    const user = (req as any).user;

    return await this.organizationRoleService.retrieve(user.id);
  }
}
