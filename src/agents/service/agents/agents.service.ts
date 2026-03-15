// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { AgentsRepository } from '../../repositories/agents/agents.repository';
import { AgentDto } from '../../dto/response/agent/agent.dto';
import { AgentNotFoundError, AgentRequiredIdError } from '../error/agents.error';
import { CreateAgentParametersDto } from '../../dto/parameters/create/agents/create-agents-parameters';
import { UpdateAgentParametersDto } from '../../dto/parameters/update/update-agents-parameters.dto';

/**
 * Service responsible for agents read use-cases.
 *
 * Responsibilities:
 * - validate input for read operations.
 * - orchestrate repository calls.
 * - map missing/invalid data into HTTP exceptions.
 */
@Injectable()
export class AgentsService {
    // MARK: - Constructor

    /**
     * Creates a new {@link AgentsService}.
     *
     * @param agentsRepository - The repository responsible for agent persistence
     * and lookup operations.
     */
    constructor(private readonly agentsRepository: AgentsRepository) {}

    // MARK: - Instance methods

    /**
     * Creates a new agent.
     *
     * @param parameters - The parameters for the agent creation.
     * @returns The created agent as a response DTO.
     */
    async create(parameters: CreateAgentParametersDto): Promise<AgentDto> {
        const agent = await this.agentsRepository.create(parameters.name, parameters.description);

        return AgentDto.from(agent);
    }

    /**
     * Finds an agent by its unique identifier.
     *
     * @param id - The unique identifier of the agent.
     * @returns The found agent as a response DTO.
     * @throws AgentRequiredIdError when the id is empty or not provided.
     * @throws AgentNotFoundError when the agent cannot be found.
     */
    async findById(id: string): Promise<AgentDto> {
        if (!id) throw new AgentRequiredIdError;

        const agent = await this.agentsRepository.findById(id);

        if (!agent) throw new AgentNotFoundError;

        return AgentDto.from(agent);
    }

    /**
     * Retrieves agents.
     *
     * @returns Array of agents.
     */
    async retrieve(): Promise<AgentDto[]> {
        const agents = await this.agentsRepository.retrieve();

        return agents.map(AgentDto.from);
    }

    /**
     * Updates an agent.
     *
     * @param id - The unique identifier of the agent.
     * @param parameters - The parameters for the agent update.
     * @returns The updated agent as a response DTO.
     * @throws AgentRequiredIdError when the id is empty or not provided.
     * @throws AgentNotFoundError when the agent cannot be found.
     */
    async update(id: string, parameters: UpdateAgentParametersDto): Promise<AgentDto> {
        if (!id) throw new AgentRequiredIdError;

        const agent = await this.agentsRepository.findById(id);

        if (!agent) throw new AgentNotFoundError;

        const updatedAgent = await this.agentsRepository.update(id, parameters.name, parameters.description);

        return AgentDto.from(updatedAgent);
    }
}
