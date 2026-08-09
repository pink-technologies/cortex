// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import * as path from 'path'
import * as dotenv from 'dotenv'
import { createApiConfiguration } from '@/configuration'
import { Database } from '@/infraestructure/database'
import { SeederMigration } from './seeder.migration'
import { SeedExecutionError } from './error/error'

/**
 * Seed entrypoint.
 *
 * Loads the environment file, validates configuration the same way API
 * startup does, runs the seeder migration, and closes the database connection.
 */
const targetEnv = process.env.NODE_ENV || 'development'
dotenv.config({
  path: path.resolve(process.cwd(), `env/.env.${targetEnv}`),
})

/**
 * Runs all registered seeders using the validated API configuration.
 */
async function runSeeders() {
  let configuration

  try {
    configuration = createApiConfiguration()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(
      `Invalid Cortex API configuration for seed (env/.env.${targetEnv}):\n${message}`,
    )
    process.exitCode = 1
    return
  }

  const database = new Database(configuration)
  const success = await _executeSeeders(database)
  await database.$disconnect()
  if (!success) {
    process.exitCode = 1
  }
}

async function _executeSeeders(database: Database): Promise<boolean> {
  try {
    await SeederMigration.prepare(database)
    return true
  } catch (error) {
    throw new SeedExecutionError('Seeder failed.', error)
  }
}

void runSeeders()
