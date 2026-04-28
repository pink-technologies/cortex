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
    UseFilters 
} from '@nestjs/common';

/**
 * HTTP controller responsible for handling authentication-related requests.
 *
 * This controller acts as the transport-layer entry point for authentication
 * operations and delegates all business logic to the
 * {@link AuthenticationService}.
 */
@Controller()
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
    constructor(private readonly organizationRoleService: OrganizationRolesService) { }

    // MARK: - Instance methods

    /**
     * Completes the password reset process for a user account.
     *
     * This endpoint verifies the password reset confirmation code and,
     * if valid, sets the new password for the account. The confirmation
     * code is typically delivered through email or another registered
     * contact method after a password reset was requested.
     *
     * Security considerations:
     * - The response does not disclose whether the account exists.
     * - Error messages are intentionally generic to prevent account enumeration.
     * - Confirmation attempts may be rate-limited to prevent brute-force attacks.
     * - Password policies are enforced before accepting the new password.
     *
     * A successful operation returns **204 No Content** with an empty body.
     *
     * @param parameters Validated data required to complete the password reset.
     * Typically includes the account identifier (e.g., email or username),
     * the confirmation code, and the new password.
     *
     * @throws HttpException If the operation fails due to:
     * - Invalid or expired confirmation code
     * - Password policy violations
     * - Invalid request state
     * - Rate limiting or security restrictions
     * - Upstream authentication provider errors
     */
    @HttpCode(200)
    @Get('roles-type/:roleType')
    async findByRoleType(
        @Param('roleType', new ParseEnumPipe(RoleType)) roleType: RoleType,
    ): Promise<OrganizationRole> {
        return await this.organizationRoleService.findByRoleType(roleType);
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
    @Get('roles')
    async retrieve(): Promise<OrganizationRole[]> {
        return await this.organizationRoleService.retrieve();
    }
}
