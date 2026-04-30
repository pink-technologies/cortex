// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { RoleStatus } from '@prisma/client';
import {
  Database,
  type DatabaseTransaction,
  type RoleType,
  OrganizationRole,
} from '@/infraestructure/database';

/**
 * Input parameters required to create an organization role.
 *
 * All input values are expected to be normalized before being passed
 * to the repository.
 */
export type CreateOrganizationRoleParameters = {
  /** The display name of the role. */
  name: string;

  /** The unique key for the role within the organization. */
  key: string;

  /** Whether this is a system-defined role. */
  isSystem: boolean;

  /** The system role key, if this is a system role. */
  systemKey?: RoleType;

  /** The unique identifier of the organization this role belongs to. */
  organizationId: string;
};

/**
 * Repository responsible for persisting and querying organization role entities.
 *
 * Encapsulates database access for OrganizationRole. Use
 * {@link DatabaseTransaction} when calling from within
 */
@Injectable()
export class OrganizationRolesRepository {
  // MARK: - Constructor

  /**
   * Creates a new {@link OrganizationRolesRepository}.
   *
   * @param database - The database client used to run transactions. Injected at
   * runtime to support inversion of control and enable testability.
   */
  constructor(private readonly database: Database) { }

  // MARK: - Instance methods

  /**
   * Finds an organization role by its unique identifier.
   *
   * @param id - The unique identifier of the role.
   * @returns The matching role or null if not found.
   */
  async findById(id: string): Promise<OrganizationRole | null> {
    return await this.database.organizationRole.findFirst({ where: { id, deletedAt: null } });
  }

  /**
   * Finds an organization role by `type` within a specific organization.
   *
   * `organizationId` is required: the same `RoleType` exists once per organization.
   * Filters on the `type` column, not `key` (display keys may differ from `RoleType`).
   *
   * @param organizationId - The organization that owns the role.
   * @param roleType - The `RoleType` enum value to match.
   * @param options - Optional transaction. Pass when inside
   *   {@link Database.withTransaction}.
   * @returns The organization role entity if found, or null otherwise.
   */
  async findByRoleType(
    roleType: RoleType,
    options?: { transaction?: DatabaseTransaction },
  ): Promise<OrganizationRole | null> {
    const database = options?.transaction ?? this.database;

    return await database.organizationRole.findFirst({
      where: {
        type: roleType,
        deletedAt: null,
      },
    });
  }

  /**
   * Retrieves all organization roles.
   *
   * @returns A list of all organization roles.
   */
  async retrieve(): Promise<OrganizationRole[]> {
    return this.database.organizationRole.findMany({
      where: {
        status: RoleStatus.ACTIVE,
        deletedAt: null,
      },
      orderBy: {
        key: 'asc',
      },
    });
  }
}
