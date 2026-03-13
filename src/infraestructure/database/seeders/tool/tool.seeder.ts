// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Database } from "src/infraestructure/database";
import { BaseSeeder } from "../base.seeder";

/**
 * Seeder to populate the `Tool` table with initial data.
 */
export class ToolSeeder implements BaseSeeder {
    // MARK: - Constructor

    /**
     * Creates a new {@link ToolSeeder} instance.
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
        this.database.$connect
        const tools = [
            {
                slug: 'hello-world-tool',
                name: 'Hello World Tool',
                description: 'This tool is used to say hello to the world',
            },
            {
                slug: 'uuid-generator-tool',
                name: 'UUID Generator Tool',
                description: 'This tool is used to generate a UUID',
            },
        ];

        await this.database.tool.createMany({
            data: tools,
            skipDuplicates: true,
        });
    }

    /**
     * Reverts the seeding by deleting all records in WorkspaceRole.
     */
    async revert(): Promise<void> {
        await this.database.tool.deleteMany({});
    }
}