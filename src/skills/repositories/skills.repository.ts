// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import {
    Database,
    Skill,
} from 'src/infraestructure/database';

/**
 * Repository responsible for querying {@link Skill} entities.
 *
 * ## Responsibilities
 * - Encapsulates all database access patterns for Skill entities
 * - Maps Prisma query shapes to semantic, domain-aware method names
 * - Ensures that application services remain agnostic about persistence details
 * - Provides a single point of change if persistence layer needs to evolve
 *
 * ## Design Principles
 * - Each method has a single, well-defined responsibility
 * - Method names clearly express intent (e.g., `isSkillRegistered` vs generic `find`)
 * - All input is assumed to be normalized before reaching the repository
 * - The repository returns domain entities, not raw Prisma models
 *
 * ## Usage
 * This repository is injected into application services that need to perform
 * skill-related database operations. Services remain decoupled from Prisma
 * by depending on this abstraction instead of directly using the Database class.
 *
 * @example
 * ```typescript
 * constructor(private readonly skillsRepository: SkillsRepository) {}
 *
 * async validateSkillName(name: string): Promise<void> {
 *   const exists = await this.skillsRepository.isSkillRegistered(name);
 *   if (exists) {
 *     throw new SkillNameAlreadyRegisteredError();
 *   }
 * }
 * ```
 */
@Injectable()
export class SkillsRepository {
    // MARK: - Constructor

    /**
     * Creates a new {@link SkillsRepository}.
     *
     * @param database - The database client used to perform skill operations.
     * Injected at runtime to support inversion of control and enable testability.
     */
    constructor(private readonly database: Database) { }

    // MARK: - Instance methods

    /**
     * Finds a skill by its unique identifier.
     *
     * @param id - The unique skill identifier.
     * @returns The {@link Skill} entity if found, or null otherwise.
     *
     * @example
     * ```typescript
     * const skill = await skillsRepository.findById(skillId);
     * if (!skill) {
     *   throw new SkillNotFoundError();
     * }
     * ```
     */
    async findById(id: string): Promise<Skill | null> {
        return this.database.skill.findUnique({
            where: { id: id },
        });
    }

    /**
     * Finds a skill by its name.
     *
     * Use this when the caller resolves skills by human-readable name rather
     * than id.
     *
     * @param name - The skill name to search.
     * @returns The first matching {@link Skill} entity, or null if none exists.
     *
     * @example
     * ```typescript
     * const skill = await skillsRepository.findByName('nestjs-best-practices');
     * if (!skill) {
     *   throw new SkillNotFoundError();
     * }
     * ```
     */
    async findByName(name: string): Promise<Skill | null> {
        return this.database.skill.findFirst({
            where: { name: name },
        });
    }

    /**
     * Checks whether a skill name is already registered.
     *
     * This method uses a count query rather than fetching full skill records
     * to avoid unnecessary data retrieval.
     *
     * The skill name is expected to be normalized before being passed to
     * this method. Normalization should occur at the API boundary.
     *
     * @param name - The normalized skill name to check.
     * @returns true if the skill is already registered, false otherwise.
     *
     * @example
     * ```typescript
     * const isRegistered = await skillsRepository.isSkillRegistered('nestjs');
     * if (isRegistered) {
     *   throw new SkillNameAlreadyRegisteredError();
     * }
     * ```
     */
    async isSkillRegistered(name: string): Promise<boolean> {
        const count = await this.database.skill.count({
            where: { name: name },
        });

        return count > 0;
    }

    /**
     * Retrieves all skills ordered alphabetically by name.
     *
     * This method is intended for catalog-like responses where clients need
     * a deterministic ordering for rendering and searching.
     *
     * @returns An array of {@link Skill} entities sorted by name ascending.
     *
     * @example
     * ```typescript
     * const skills = await skillsRepository.retrieve();
     * ```
     */
    async retrieve(): Promise<Skill[]> {
        return this.database.skill.findMany({
            orderBy: { name: 'asc' },
        });
    }
}
