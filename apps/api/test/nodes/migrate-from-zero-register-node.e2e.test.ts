// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  HttpStatus,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { Client } from 'pg'
import request from 'supertest'
import { NodeArchitecture, NodeOperatingSystem } from '@cortex/protocol'
import { AppModule } from '../../src/app.module'
import { Database } from '../../src/infraestructure/database'

const execFileAsync = promisify(execFile)

/**
 * Builds a Postgres URL that targets `databaseName` while preserving the rest
 * of the connection settings from `sourceUrl`.
 */
function replaceDatabaseName(sourceUrl: string, databaseName: string): string {
  const url = new URL(sourceUrl)
  url.pathname = `/${databaseName}`
  return url.toString()
}

/**
 * Creates an empty Postgres database for a one-shot migrate-from-zero proof.
 */
async function createEmptyDatabase(adminUrl: string, databaseName: string): Promise<void> {
  const client = new Client({ connectionString: adminUrl })
  await client.connect()

  try {
    await client.query(`DROP DATABASE IF EXISTS "${databaseName}"`)
    await client.query(`CREATE DATABASE "${databaseName}"`)
  } finally {
    await client.end()
  }
}

/**
 * Drops a disposable Postgres database created for this suite.
 */
async function dropDatabase(adminUrl: string, databaseName: string): Promise<void> {
  const client = new Client({ connectionString: adminUrl })
  await client.connect()

  try {
    await client.query(
      `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid()
      `,
      [databaseName],
    )
    await client.query(`DROP DATABASE IF EXISTS "${databaseName}"`)
  } finally {
    await client.end()
  }
}

/**
 * Applies every Prisma migration to an empty database (migrate-from-zero).
 */
async function migrateFromZero(databaseUrl: string, monorepoRoot: string): Promise<void> {
  await execFileAsync(
    'pnpm',
    [
      'exec',
      'prisma',
      'migrate',
      'deploy',
      '--config',
      'apps/api/src/infraestructure/database/prisma.config.ts',
    ],
    {
      cwd: monorepoRoot,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
    },
  )
}

describe('migrate from zero + node register (e2e)', () => {
  const monorepoRoot = path.resolve(__dirname, '../../../..')
  const sourceDatabaseUrl =
    process.env.DATABASE_URL ?? 'postgresql://postgres:@localhost:5432/cortex'
  const adminUrl = replaceDatabaseName(sourceDatabaseUrl, 'postgres')
  const databaseName = `cortex_migrate_zero_${Date.now()}`
  const databaseUrl = replaceDatabaseName(sourceDatabaseUrl, databaseName)

  let previousDatabaseUrl: string | undefined
  let app: INestApplication | undefined
  let database: Database | undefined

  beforeAll(async () => {
    previousDatabaseUrl = process.env.DATABASE_URL
    process.env.NODE_ENV ??= 'development'

    await createEmptyDatabase(adminUrl, databaseName)
    await migrateFromZero(databaseUrl, monorepoRoot)

    process.env.DATABASE_URL = databaseUrl

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    )

    await app.init()
    database = app.get(Database)
  }, 120_000)

  afterAll(async () => {
    if (app) {
      await app.close()
    }

    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl
    }

    await dropDatabase(adminUrl, databaseName)
  })

  it('registers a Node against a schema produced by migrate deploy from an empty database', async () => {
    expect(app).toBeDefined()
    expect(database).toBeDefined()

    const installationId = randomUUID()
    const registration = {
      architecture: NodeArchitecture.ARM64,
      capabilities: ['os.macos'],
      installationId,
      labels: ['pool:v0'],
      name: `migrate-zero-${installationId.slice(0, 8)}`,
      operatingSystem: NodeOperatingSystem.MACOS,
      supportedKinds: ['system.test'],
      version: '0.1.0',
    }

    const response = await request(app!.getHttpServer())
      .post('/api/internal/nodes/register')
      .send(registration)
      .expect(HttpStatus.CREATED)

    expect(response.body).toEqual({
      heartbeatIntervalSeconds: 30,
      nodeId: expect.any(String),
    })

    const persisted = await database!.executionNode.findUniqueOrThrow({
      where: { installationId },
    })

    expect(persisted).toEqual(
      expect.objectContaining({
        architecture: NodeArchitecture.ARM64,
        capabilities: ['os.macos'],
        id: response.body.nodeId,
        installationId,
        labels: ['pool:v0'],
        name: registration.name,
        operatingSystem: NodeOperatingSystem.MACOS,
        supportedKinds: ['system.test'],
        version: '0.1.0',
      }),
    )
  })
})
