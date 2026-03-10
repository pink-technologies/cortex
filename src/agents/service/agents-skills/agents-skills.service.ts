// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentNotFoundError } from "../error/agents.error";
import { AgentsSkillsResponseDto } from "src/agents/dto/response/agents-skills/agents-skills.response.dto";
import { AgentsSkillsRepository } from "../../repositories/agents-skills/agents-skills.repository";
import { AgentsRepository } from "src/agents/repositories/agents.repository";
import { Injectable } from "@nestjs/common";
import { I18nService } from "src/i18n";
import { SkillNotFoundError } from "src/skills/service/error/skills.error";
import { SkillsRepository } from "src/skills/repositories/skills.repository";


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
        private readonly skillsRepository: SkillsRepository,
        private readonly agentsRepository: AgentsRepository,
        private readonly i18nService: I18nService,
    ) { }

    // MARK: - Instance methods

    /**
     * Adds a skill to an agent.
     *
     * @param agentId - The unique identifier of the agent.
     * @param skillId - The unique identifier of the skill.
     * @returns A success message.
     * @throws AgentNotFoundError when the agent cannot be found.
     * @throws SkillNotFoundError when the skill cannot be found.
     */
    async addSkill(agentId: string, skillId: string): Promise<string> {
        const agent = await this.agentsRepository.findById(agentId);

        if (!agent) throw new AgentNotFoundError;

        const skill = await this.skillsRepository.findById(skillId);

        if (!skill) throw new SkillNotFoundError;

        await this.agentsSkillsRepository.addSkill(agent.id, skill.id);

        return this.i18nService.agentsSkills.skillAddedToAgentSuccessfully();
    }

    /**
     * Removes a skill from an agent.
     *
     * @param agentId - The unique identifier of the agent.
     * @param skillId - The unique identifier of the skill.
     * @returns A success message.
     * @throws AgentNotFoundError when the agent cannot be found.
     * @throws SkillNotFoundError when the skill cannot be found.
     */
    async removeSkill(agentId: string, skillId: string): Promise<string> {
        const agent = await this.agentsRepository.findById(agentId);

        if (!agent) throw new AgentNotFoundError;

        const skill = await this.skillsRepository.findById(skillId);

        if (!skill) throw new SkillNotFoundError;

        await this.agentsSkillsRepository.removeSkill(agent.id, skill.id);

        return this.i18nService.agentsSkills.skillRemovedFromAgentSuccessfully();
    }

    /**
     * Retrieves all skills for an agent.
     *
     * @param agentId - The unique identifier of the agent.
     * @returns The {@link AgentsSkillsResponseDto} entities.
     */
    async retrieveByAgentId(agentId: string): Promise<AgentsSkillsResponseDto[]> {
        const agent = await this.agentsRepository.findById(agentId);

        if (!agent) throw new AgentNotFoundError;

        const agentSkills = await this.agentsSkillsRepository.retrieveByAgentId(agent.id);

        return agentSkills.map(AgentsSkillsResponseDto.from);
    }
}
