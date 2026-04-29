// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Database } from "src/infraestructure/database";
import { OrganizationRoleSeeder } from "./organization-role/organization.role.seeder";

/**
 * SeederMigration is responsible for orchestrating the execution of all individual database seeders.
 *
 * This class ensures that:
 * 1. Seeders are executed in the correct order (important for tables with foreign key dependencies)
 * 2. Seeders can be reverted in reverse order if needed
 *
 * Usage:
 * ```
 * await SeederMigration.run();   // Seed all tables
 * await SeederMigration.revert(); // Revert seeded data
 * ```
 */
export class SeederMigration {
    // MARK: - Migration

    /**
     * Executes all registered seeders.
     *
     * @param database - The Database instance to use for seeding
     */
    static async prepare(database: Database) {
        await new OrganizationRoleSeeder(database).prepare();
    }

    /**
     * Reverts all seeders in reverse order.
     *
     * @param database - The Database instance to use for reverting
     */
    static async revert(database: Database) {
        await new OrganizationRoleSeeder(database).revert();
    }
}
