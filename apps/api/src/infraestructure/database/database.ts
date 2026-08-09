// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { API_CONFIGURATION, type ApiConfiguration } from '@/configuration'

/**
 * Transaction type exposed by the database layer.
 *
 * Use this type when accepting an optional transaction in repository methods
 * (e.g. `options?: { transaction?: DatabaseTransaction }`). The same type is
 * passed to the callback of {@link Database.withTransaction}.
 *
 * Import from `@integrations/database`; do not use Prisma types directly.
 */
export type DatabaseTransaction = Prisma.TransactionClient

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
   * Creates a Database instance using the validated API configuration.
   *
   * Uses the Prisma PostgreSQL adapter to connect to the database. The
   * connection is established in {@link onModuleInit} and closed in
   * {@link onModuleDestroy}.
   *
   * @param configuration - Validated API configuration providing `databaseURL`.
   */
  constructor(
    @Inject(API_CONFIGURATION)
    readonly configuration: ApiConfiguration,
  ) {
    super({
      adapter: new PrismaPg({
        connectionString: configuration.databaseURL,
      }),
    })
  }

  // MARK: - OnModuleDestroy

  async onModuleDestroy() {
    await this.$disconnect()
  }

  // MARK: - OnModuleInit

  async onModuleInit() {
    await this.$connect()
  }

  // MARK: - Instance methods

  /**
   * Runs the given function inside a database transaction.
   *
   * All operations executed inside the callback share the same transaction.
   * If the callback throws or rejects, the transaction is rolled back.
   * Otherwise it is committed.
   *
   * Pass the `transaction` argument to repository methods that support
   * `options?.transaction` so they participate in this transaction.
   *
   * @param fn - Callback receiving the transaction client. Run all
   *   transactional operations inside this callback using `transaction`.
   * @returns The value resolved by the callback.
   *
   * @throws {DatabaseError} when any operation in the transaction fails
   * or when the transaction cannot be started or committed.
   *
   * @example
   * ```typescript
   * await this.database.withTransaction(async (transaction) => {
   *   const workspace = await this.workspacesRepository.create(params, { transaction });
   *   await this.rolesRepository.createWorkspaceRole(roleParams, { transaction });
   *   await this.rolesRepository.createWorkspaceMembership(memberParams, { transaction });
   *   return workspace;
   * });
   * ```
   */
  async withTransaction<T>(fn: (transaction: DatabaseTransaction) => Promise<T>): Promise<T> {
    return this.$transaction(fn)
  }
}
