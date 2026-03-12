// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Contract that defines the structure of a database seeder.
 *
 * A seeder is responsible for inserting initial or required data into the database
 * and optionally reverting those changes when needed.
 *
 * Implementations of this interface should ensure that:
 * - `run` performs idempotent insert operations when possible
 * - `revert` safely removes only the data introduced by the seeder
 */
export interface BaseSeeder {
    /**
     * Executes the seeding process.
     *
     * This method should insert the required records into the database.
     * It is recommended to make this operation idempotent (e.g., using
     * upserts or `skipDuplicates`) so it can be run multiple times safely.
     *
     * @returns A promise that resolves when the seeding process completes.
     */
    prepare(): Promise<void>;

    /**
     * Reverts the seeding process.
     *
     * This method should remove or roll back the data inserted by {@link run}.
     * It is typically used in development, testing, or rollback scenarios.
     *
     * @returns A promise that resolves when the revert operation completes.
     */
    revert(): Promise<void>;
}
