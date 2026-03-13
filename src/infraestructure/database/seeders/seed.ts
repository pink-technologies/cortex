// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import * as path from 'path';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { Database } from "src/infraestructure/database";
import { SeederMigration } from "./seeder.migration";
import { SeedExecutionError } from "./error/seed-execution-error";

/**
 * Seed entrypoint.
 *
 * Loads the environment file, validates the connection string,
 * runs the seeder migration, and closes the database connection.
 */
const targetEnv = process.env.NODE_ENV || 'development';
dotenv.config({
    path: path.resolve(process.cwd(), `env/.env.${targetEnv}`),
});

/**
 * Runs all registered seeders using the current DATABASE_URL.
 */
async function runSeeders() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error(
            `DATABASE_URL is missing. Check env/.env.${targetEnv} and ConfigModule.forRoot envFilePath.`,
        );
        process.exitCode = 1;
        return;
    }

    const configService = new ConfigService();
    const database = new Database(configService);
    const success = await _executeSeeders(database);
    await database.$disconnect();
    if (!success) {
        process.exitCode = 1;
    }
}

async function _executeSeeders(database: Database): Promise<boolean> {
    try {
        await SeederMigration.prepare(database);
        return true;
    } catch (error) {
        throw new SeedExecutionError('Seeder failed.', error);
    }
}

runSeeders();
