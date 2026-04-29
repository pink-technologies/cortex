// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ConfigService } from '@nestjs/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Transaction type exposed by the database layer.
 *
 * Use this type when accepting an optional transaction in repository methods
 * (e.g. `options?: { tx?: TransactionClient }`). The same type is passed to
 * the callback of {@link Database.withTransaction}.
 *
 * Import from `@integrations/database`; do not use Prisma types directly.
 */
export type DatabaseTransaction = Prisma.TransactionClient;

/**
 * NestJS wrapper around {@link PrismaClient} responsible for managing
 * the database connection lifecycle.
 *
 * This service integrates Prisma with the NestJS application lifecycle
 * by establishing the database connection when the module initializes
 * and gracefully disconnecting when the module is destroyed.
 *
 * Responsibilities:
 * - manage connection setup and teardown,
 * - expose PrismaClient capabilities via dependency injection,
 * - ensure database resources are released during application shutdown.
 * - provide {@link withTransaction} for atomic multi-step operations.
 */
@Injectable()
export class Database extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // MARK: - Constructor

  /**
   * Creates a Database instance using the connection string from ConfigService.
   *
   * Uses the Prisma PostgreSQL adapter to connect to the database. The connection
   * is established in {@link onModuleInit} and closed in {@link onModuleDestroy}.
   *
   * @param configService - NestJS ConfigService for reading DATABASE_URL.
   * @throws {Error} If DATABASE_URL is not set in the environment.
   */
  constructor(readonly configService: ConfigService) {
    const connectionString = configService.get('DATABASE_URL');

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is missing. Check env/.env.<NODE_ENV> and ConfigModule.forRoot envFilePath.',
      );
    }

    super({
      adapter: new PrismaPg({
        connectionString,
      }),
    });
  }

  // MARK: - OnModuleDestroy

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // MARK: - OnModuleInit

  async onModuleInit() {
    await this.$connect();
  }

  // MARK: - Instance methods

  /**
   * Runs the given function inside a database transaction.
   *
   * All operations executed inside the callback share the same transaction.
   * If the callback throws or rejects, the transaction is rolled back.
   * Otherwise it is committed.
   *
   * Pass the `tx` argument to repository methods that support
   * `options?.tx` so they participate in this transaction.
   *
   * @param fn - Callback receiving the transaction client. Run all
   *   transactional operations inside this callback using `tx`.
   * @returns The value resolved by the callback.
   *
   * @throws {DatabaseError} when any operation in the transaction fails
   * or when the transaction cannot be started or committed.
   *
   * @example
   * ```typescript
   * await this.database.withTransaction(async (tx) => {
   *   const organization = await this.organizationsRepository.create(params, { tx });
   *   await this.rolesRepository.createOrganizationRole(roleParams, { tx });
   *   await this.rolesRepository.createOrganizationMembership(memberParams, { tx });
   *   return organization;
   * });
   * ```
   */
  async withTransaction<T>(fn: (tx: DatabaseTransaction) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }
}
