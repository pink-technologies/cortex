// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Database } from '../../database';
import { RoleStatus, RoleType } from '@prisma/client';
import { BaseSeeder } from '../base.seeder';

/**
 * Seeder to populate `OrganizationRole` for a bootstrap organization.
 *
 * Keys must match `RoleType` enum strings (`OWNER`, `ADMIN`, …) because
 * `OrganizationRolesRepository.findByRoleType` queries `key` with that enum.
 */
export class OrganizationRoleSeeder implements BaseSeeder {
    // MARK: - Constructor

    /**
     * Creates a new {@link OrganizationRoleSeeder} instance.
     *
     * @param database - The {@link Database} service injected by NestJS.
     *   This provides access to the PrismaClient instance, allowing the seeder
     *   to perform database operations such as inserting, updating, or deleting
     *   data. It also enables participation in transactions via
     *   {@link Database.withTransaction}.
     */
    constructor(private readonly database: Database) { }

    // MARK: - AsyncMigration

    /**
     * Inserts the roles into the database.
     * Uses `createMany` with `skipDuplicates` to ensure idempotency.
     */
    async prepare(): Promise<void> {
        const roles = [
            {
                key: RoleType.ADMIN,
                type: RoleType.ADMIN,
                status: RoleStatus.ACTIVE,
            },
            {
                key: RoleType.MEMBER,
                type: RoleType.MEMBER,
                status: RoleStatus.ACTIVE,
            },
            {
                key: RoleType.OWNER,
                type: RoleType.OWNER,
                status: RoleStatus.ACTIVE,
            },
            {
                key: RoleType.VIEWER,
                type: RoleType.VIEWER,
                status: RoleStatus.ACTIVE,
            },
        ];

        await this.database.organizationRole.createMany({
            data: roles,
            skipDuplicates: true,
        });
    }

    /**
     * Reverts the seeding by deleting organization roles only when no members
     * reference them. Global roles are shared across organizations; bulk delete
     * would otherwise remove every member of that role (or fail with RESTRICT).
     */
    async revert(): Promise<void> {
        await this.database.organizationRole.deleteMany({
            where: {
                members: { none: {} },
            },
        });
    }
}