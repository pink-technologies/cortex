// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { Database, type DatabaseTransaction, Organization } from '@/infraestructure/database';
import { OrganizationStatus } from '@prisma/client';

/**
 * Repository responsible for persisting and querying organization entities.
 *
 * ## Responsibilities
 * - Encapsulates all database access patterns for Organization entities
 * - Maps Prisma query shapes to semantic, domain-aware method names
 * - Ensures that application services remain agnostic about persistence details
 * - Provides a single point of change if persistence layer needs to evolve
 *
 * ## Design Principles
 * - Each method has a single, well-defined responsibility
 * - Method names clearly express intent
 * - All input is assumed to be normalized before reaching the repository
 * - The repository returns domain entities, not raw Prisma models
 *
 * ## Usage
 * This repository is injected into application services that need to perform
 * organization-related database operations. Services remain decoupled from Prisma
 * by depending on this abstraction instead of directly using the Database class.
 *
 * @example
 * ```typescript
 * constructor(private readonly organizationsRepository: OrganizationsRepository) {}
 *
 * async createOrganization(params: CreateOrganizationParameters): Promise<Organization> {
 *   return this.organizationsRepository.create(name);
 * }
 * ```
 */
@Injectable()
export class OrganizationsRepository {
  // MARK: - Constructor

  /**
   * Creates a new {@link OrganizationsRepository}.
   *
   * @param database - The database client used to perform organization operations.
   * Injected at runtime to support inversion of control and enable testability.
   */
  constructor(private readonly database: Database) { }

  // MARK: - Instance methods

  /**
   * Creates a new organization record.
   *
   * This method creates a organization with the provided name.
   * The slug is derived from the name (lowercased, hyphenated). Timestamps
   * are managed by the database.
   *
   * All input data (name) is expected to be normalized before being
   * passed to this method.
   *
   * @param name - The name of the organization.
   * @param options - The options for the organization creation.
   * @returns The newly created organization entity.
   *
   * @throws {DatabaseEntityConflictError} if the slug already exists
   * (assuming unique constraints are enforced in the database schema).
   * @throws {DatabaseError} if any other database operation fails.
   *
   * @example
   * ```typescript
   * const organization = await organizationsRepository.create({
   *   name: "John's Organization",
   * });
   * ```
   */
  async create(
    name: string,
    options?: { transaction?: DatabaseTransaction },
  ): Promise<Organization> {
    const database = options?.transaction ?? this.database;
    const slug = name
      .split("'")[0].split("’")[0]
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return database.organization.create({
      data: {
        name: name,
        slug: slug,
        status: OrganizationStatus.ACTIVE,
      },
    });
  }

  /**
   * Finds a organization by its unique identifier.
   *
   * @param id - The unique identifier of the organization.
   * @returns The organization entity if found, or null if no organization exists with this id.
   *
   * @example
   * ```typescript
   * const organization = await organizationsRepository.find(id);
   * if (!organization) {
   *   throw new OrganizationNotFoundError();
   * }
   * ```
   */
  async find(id: string) {
    return this.database.organization.findUnique({
      where: { id },
    });
  }

  /**
   * Finds a organization by its slug.
   *
   * The slug is a unique identifier used in URLs and must be unique
   * across all organizations.
   *
   * @param slug - The slug identifier to search for.
   * @returns The organization entity if found, or null if no organization exists with this slug.
   *
   * @example
   * ```typescript
   * const organization = await organizationsRepository.findBySlug('johns-organization');
   * ```
   */
  async findBySlug(slug: string) {
    return this.database.organization.findUnique({
      where: { slug },
    });
  }
}
