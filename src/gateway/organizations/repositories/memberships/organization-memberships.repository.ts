// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { MembershipStatus } from '@prisma/client';
import {
  Database,
  type DatabaseTransaction,
  OrganizationMembership
} from '@/infraestructure/database';

/**
 * Input parameters required to create a organization membership.
 *
 * All input values are expected to be normalized before being passed
 * to the repository.
 */
export type CreateOrganizationMembershipParameters = {
  /** The unique identifier of the role to assign to the user. */
  roleId: string;

  /** The unique identifier of the user. */
  userId: string;

  /** The unique identifier of the organization. */
  organizationId: string;
};

/**
 * Repository responsible for persisting and querying organization membership entities.
 *
 * Encapsulates database access for OrganizationMembership. Use
 * {@link DatabaseTransaction} when calling from within
 * {@link Database.withTransaction}.
 */
@Injectable()
export class OrganizationMembershipsRepository {
  // MARK: - Constructor

  /**
   * Creates a new {@link OrganizationMembershipsRepository}.
   *
   * @param database - The database client used to perform organization operations.
   * Injected at runtime to support inversion of control and enable testability.
   */
  constructor(private readonly database: Database) { }

  // MARK: - Instance methods

  /**
   * Creates a organization membership.
   *
   * Links a user to a organization with a specific role. Status is set to ACTIVE
   * and joinedAt to the current time.
   *
   * @param parameters - The parameters required to create the membership.
   * @param options - Optional transaction. Pass when inside
   *   {@link Database.withTransaction}.
   * @returns The newly created organization membership entity.
   *
   * @throws {DatabaseEntityConflictError} if the user is already a member
   *   of the organization.
   * @throws {DatabaseError} if any other database operation fails.
   */
  async create(
    parameters: CreateOrganizationMembershipParameters,
    options?: { transaction?: DatabaseTransaction },
  ) {
    const database = options?.transaction ?? this.database;
    return database.organizationMembership.create({
      data: {
        roleId: parameters.roleId,
        status: MembershipStatus.ACTIVE,
        userId: parameters.userId,
        organizationId: parameters.organizationId,
      },
    });
  }

  /**
   * Finds a user's membership in a organization, if any.
   *
   * @param userId - The unique identifier of the user.
   * @param organizationId - The unique identifier of the organization.
   * @returns The organization membership entity if found, or null otherwise.
   */
  async findByUserAndOrganization(
    userId: string,
    organizationId: string
  ): Promise<OrganizationMembership | null> {
    return this.database.organizationMembership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
    });
  }
}
