// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Database } from '../../database';
import { RoleType } from "@prisma/client";
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
                name: 'Administrador',
                key: RoleType.ADMIN,
                description: 'Administrator of the organization',
                type: RoleType.ADMIN,
            },
            {
                name: 'Member',
                key: RoleType.MEMBER,
                type: RoleType.MEMBER,
                description: 'Member of the organization',
            },
            {
                name: 'Owner',
                key: RoleType.OWNER,
                description: 'Owner of the organization',
                type: RoleType.OWNER,
            },
            {
                name: 'Viewer',
                key: RoleType.VIEWER,
                description: 'Viewer of the organization',
                type: RoleType.VIEWER,
            },
        ];

        await this.database.organizationRole.createMany({
            data: roles,
            skipDuplicates: true,
        });
    }

    /**
     * Reverts the seeding by deleting all records in OrganizationRole.
     */
    async revert(): Promise<void> {
        await this.database.organizationRole.deleteMany({});
    }
}