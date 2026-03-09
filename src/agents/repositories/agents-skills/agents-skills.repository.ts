// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import {
    Database,
    type Agent,
    AgentSkill,
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
export class AgentsSkillsRepository {
    // MARK: - Constructor

    /**
     * Creates a new {@link AgentsSkillsRepository}.
     *
     * @param database - The database client used to perform skill operations.
     * Injected at runtime to support inversion of control and enable testability.
     */
    constructor(private readonly database: Database) { }

    // MARK: - Instance methods

    /**
     * Adds a skill to an agent.
     *
     * @param agentId - The unique identifier of the agent.
     * @param skillId - The unique identifier of the skill.
     * @returns The added {@link AgentSkill} entity.
     */
    async addSkill(agentId: string, skillId: string): Promise<AgentSkill> {
        return this.database.agentSkill.create({
            data: {
                agentId: agentId,
                skillId: skillId,
            },
        });
    }

    /**
     * Retrieves all skills for an agent.
     *
     * @param agentId - The unique identifier of the agent.
     * @returns The {@link AgentSkill} entities.
     */
    async retrieveByAgentId(agentId: string): Promise<AgentSkill[]> {
        return this.database.agentSkill.findMany({
            where: { agentId: agentId },
            include: {
                skill: true,
            },
        });
    }

    /**
     * Removes a skill from an agent.
     *
     * @param agentId - The unique identifier of the agent.
     * @param skillId - The unique identifier of the skill.
     * @returns The removed {@link AgentSkill} entity.
     */
    async removeSkill(agentId: string, skillId: string): Promise<AgentSkill> {
        return this.database.agentSkill.delete({
            where: {
                agentId_skillId: {
                    agentId: agentId,
                    skillId: skillId
                },
            },
        });
    }
}
