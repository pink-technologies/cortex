// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { OrganizationRole } from '@/infraestructure/database';
import { RoleType } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { OrganizationRolesRepository } from '../../repositories';
import { RoleNotFound } from '../error/organization.error';
import { toOrganizationHttpException } from '../../mapper/organization-error.mapper';
import { I18nService } from '@/i18n/i18n.service';

/**
 * Service responsible for managing organization roles.
 *
 * This service provides operations to find organization roles by type and retrieve all organization roles.
 */
@Injectable()
export class OrganizationRolesService {
  // MARK: - Constructor

  /**
   * Creates a new {@link OrganizationRoles}.
   *
   * @param i18nService - The internationalization service used to resolve
   * localized, user-facing messages in a consistent and
   * domain-aware manner.
   * @param organizationRolesRepository - The repository responsible for querying organization role entities.
   */
  constructor(
    private readonly i18nService: I18nService,
    private readonly organizationRolesRepository: OrganizationRolesRepository,
  ) {}

  // MARK: - Instance methods

  /**
   * Finds an organization role by its unique identifier.
   *
   * @param id - The unique identifier of the role.
   * @param userId - The unique identifier of the user.
   * @returns The matching role or null if not found.
   *
   * @throws RoleNotFound when the role cannot be found.
   */
  async findById(id: string, userId: string): Promise<OrganizationRole> {
    try {
      const role = await this.organizationRolesRepository.findById(id, userId);

      if (!role) throw new RoleNotFound();

      return role;
    } catch (error) {
      throw toOrganizationHttpException(error, this.i18nService);
    }
  }

  /**
   * Finds an organization role by its role type within an organization.
   *
   * @param organizationId - The organization that owns the role.
   * @param roleType - The role type to look up.
   * @returns The matching role or null if not found.
   *
   * @throws RoleNotFound when the role cannot be found.
   */
  async findByRoleType(roleType: RoleType): Promise<OrganizationRole> {
    try {
      if (!Object.values(RoleType).includes(roleType)) {
        throw new RoleNotFound();
      }

      const role =
        await this.organizationRolesRepository.findByRoleType(roleType);

      if (!role) throw new RoleNotFound();

      return role;
    } catch (error) {
      throw toOrganizationHttpException(error, this.i18nService);
    }
  }

  /**
   * Retrieves all organization roles.
   *
   * @returns A list of all organization roles.
   *
   * @throws HttpException when the roles cannot be retrieved.
   */
  async retrieve(userId: string): Promise<OrganizationRole[]> {
    try {
      return await this.organizationRolesRepository.retrieve(userId);
    } catch (error) {
      throw toOrganizationHttpException(error, this.i18nService);
    }
  }
}
