// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentNotFoundError } from '../error/agents.error';
import { AgentsSkillsRepository } from "../../repositories/agents-skills/agents-skills.repository";
import { AgentsRepository } from "@/agents/repositories/agents/agents.repository";
import { Injectable } from "@nestjs/common";
import { SkillsService } from 'src/skills';

/**
 * Service responsible for agents skills read use-cases.
 *
 * Responsibilities:
 * - validate input for read operations.
 * - orchestrate repository calls.
 * - map missing/invalid data into HTTP exceptions.
 */
@Injectable()
export class AgentsSkillsService {
    // MARK: - Constructor

    /**
     * Creates a new {@link AgentsSkillsService}.
     *
     * @param agentsRepository - The repository responsible for agent persistence
     * and lookup operations.
     */
    constructor(
        private readonly agentsSkillsRepository: AgentsSkillsRepository,
        private readonly agentsRepository: AgentsRepository,
        private readonly skillsService: SkillsService,        
    ) { }

    // MARK: - Instance methods

    /**
     * Adds a skill to an agent.
     *
     * @param agentId - The unique identifier of the agent.
     * @param skillId - The unique identifier of the skill.     
     * 
     * @throws AgentNotFoundError when the agent cannot be found.
     * @throws SkillNotFoundError when the skill cannot be found.
     * @throws SkillRequiredIdError when the skill ID is empty or invalid.
     */
    async addSkill(agentId: string, skillId: string): Promise<void> {
        const agent = await this.agentsRepository.findById(agentId);

        if (!agent) throw new AgentNotFoundError;

        const skill = await this.skillsService.findById(skillId);

        await this.agentsSkillsRepository.addSkill(agent.id, skill.id);        
    }

    /**
     * Removes a skill from an agent.
     *
     * @param agentId - The unique identifier of the agent.
     * @param skillId - The unique identifier of the skill.
     *      
     * @throws AgentNotFoundError when the agent cannot be found.
     * @throws SkillNotFoundError when the skill cannot be found.
     * @throws SkillRequiredIdError when the skill ID is empty or invalid.
     */
    async removeSkill(agentId: string, skillId: string): Promise<void> {
        const agent = await this.agentsRepository.findById(agentId);

        if (!agent) throw new AgentNotFoundError;

        const skill = await this.skillsService.findById(skillId);

        await this.agentsSkillsRepository.removeSkill(agent.id, skill.id);
    }
}
