// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import {
    Database,
    type Agent,
} from 'src/infraestructure/database';

/**
 * Repository responsible for querying {@link Agent} entities.
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
export class AgentsRepository {
    // MARK: - Constructor

    /**
     * Creates a new {@link AgentsRepository}.
     *
     * @param database - The database client used to perform skill operations.
     * Injected at runtime to support inversion of control and enable testability.
     */
    constructor(private readonly database: Database) { }

    // MARK: - Instance methods

    async create(name: string, description?: string | null): Promise<Agent> {
        return this.database.agent.create({
            data: {
                name: name,
                description: description ?? null,
            },
        });
    }

    /**
     * Finds a agent by its unique identifier.
     *
     * @param id - The unique agent identifier.
     * @returns The {@link Agent} entity if found, or null otherwise.
     *
     * @example
     * ```typescript
     * const agent = await agentsRepository.findById(agentId);
     * if (!agent) {
     *   throw new SkillNotFoundError();
     * }
     * ```
     */
    async findById(id: string): Promise<Agent | null> {
        return this.database.agent.findUnique({
            where: { id: id },
        });
    }

    /**
     * Retrieves agents with optional filter and pagination.
     *
     * @returns Array of agents.
     */
    async retrieve(): Promise<Agent[]> {
        return this.database.agent.findMany({
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Updates an agent by its unique identifier.
     *
     * @param id - The unique agent identifier.
     * @param name - The new name of the agent.
     * @param description - The new description (omit to leave existing value unchanged).
     * @returns The updated {@link Agent} entity.
     */
    async update(id: string, name: string, description?: string | null): Promise<Agent> {
        return this.database.agent.update({
            where: { id: id },
            data: {
                name: name,
                ...(description !== undefined && { description: description ?? null }),
            },
        });
    }
}
