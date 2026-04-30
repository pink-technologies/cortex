// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { RoleType } from '@prisma/client';
import type { OrganizationRole } from '@/infraestructure/database';
import { OrganizationExceptionFilter } from '../../filter/exception.filter';
import { OrganizationRolesService } from '../../services/roles/organization.roles.service';
import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  UseFilters,
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
   * @param authenticationService - Application service responsible for
   * orchestrating authentication-related operations such as sign-in,
   * sign-up, token refresh, and password recovery.
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
  @HttpCode(200)
  @Get(':id')
  async findById(@Param('id') id: string): Promise<OrganizationRole> {
    return await this.organizationRoleService.findById(id);
  }

  /**
   * Confirms a newly registered user account.
   *
   * This endpoint verifies the confirmation code provided by the user
   * and completes the account activation process. The code is typically
   * delivered to the user through email or another registered contact method
   * during sign-up.
   *
   * Security considerations:
   * - The response does not disclose whether the account exists.
   * - Error responses are intentionally generic to prevent account enumeration.
   * - The operation may be rate-limited to prevent brute-force attempts.
   *
   * A successful confirmation returns **204 No Content** with an empty body.
   *
   * @param parameters Validated data required to confirm the account.
   * Typically includes the account identifier (e.g., email or username)
   * and the confirmation code.
   *
   * @throws HttpException If confirmation fails due to:
   * - Invalid or expired confirmation code
   * - Invalid request state (e.g., account already confirmed)
   * - Rate limiting or security restrictions
   * - Upstream authentication provider errors
   */
  @HttpCode(200)
  @Get()
  async retrieve(): Promise<OrganizationRole[]> {
    return await this.organizationRoleService.retrieve();
  }
}
