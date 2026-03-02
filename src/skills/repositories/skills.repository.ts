// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import type { SkillsQuery } from '../types/skills-query.type';
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
     * Checks whether a skill name is already registered.
     *
     * Normalizes the name (trim) before lookup. Empty or whitespace-only names
     * return false (no skill can match).
     *
     * @param name - The skill name to check.
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
        const trimmedName = name?.trim();
        if (!trimmedName) return false;

        const count = await this.database.skill.count({
            where: { name: trimmedName },
        });

        return count > 0;
    }

    /**
     * Retrieves skills ordered alphabetically, optionally filtered and paginated.
     *
     * @param params - name (search), page (1-based), size (items per page)
     * @returns Array of skills for the requested page.
     */
    async retrieve(params: SkillsQuery): Promise<Skill[]> {
        const page = Math.max(1, params.page ?? 1);
        const size = Math.max(1, Math.min(params.size ?? 50));
        const skip = (page - 1) * size;
        const trimmedName = params.q?.trim();

        return this.database.skill.findMany({
            where: trimmedName ? {
                name: { contains: trimmedName, mode: 'insensitive' },
            } : {},
            orderBy: { name: 'asc' },
            skip,
            take: size,
        });
    }
}
