// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentsService } from '../service/agents/agents.service';
import { AgentsExceptionFilter } from '../filter/exception.filter';
import { AgentDto } from '../dto/response/agent/agent.dto';
import { CreateAgentParametersDto } from '../dto/parameters/create/agents/create-agents-parameters';
import { UpdateAgentParametersDto } from '../dto/parameters/update/update-agents-parameters.dto';
import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    Put,
    UseFilters,
} from '@nestjs/common';

/**
 * HTTP controller responsible for handling agents-related read requests.
 *
 * This controller acts as the transport-layer entry point for agents
 * operations and delegates all business logic to the {@link AgentsService}.
 */
@Controller('agents')
@UseFilters(AgentsExceptionFilter)
export class AgentsController {
    // MARK: - Constructor

    /**
     * Creates a new {@link AgentsController}.
     *
     * @param agentsService - Application service responsible for
     * orchestrating agents-related read operations.
     */
    constructor(private readonly agentsService: AgentsService) { }

    // MARK: - Instance methods

    /**
     * Creates a new agent.
     *
     * @param parameters - The parameters for the agent creation.
     * @returns The created agent as a response DTO.
     */
    @HttpCode(201)
    @Post()
    async create(@Body() parameters: CreateAgentParametersDto): Promise<AgentDto> {
        return this.agentsService.create(parameters);
    }

    /**
     * Retrieves an agent by its unique identifier.
     *
     * @param id - The unique identifier of the agent.
     * @returns The agent as a response DTO.
     */
    @HttpCode(200)
    @Get(':id')
    async findById(@Param('id') id: string): Promise<AgentDto> {
        return this.agentsService.findById(id);
    }

    /**
     * Retrieves all agents.
     *
     * @returns Array of agents as response DTOs
     */
    @HttpCode(200)
    @Get()
    async retrieve(): Promise<AgentDto[]> {
        return this.agentsService.retrieve();
    }

    /**
     * Updates an agent.
     *
     * @param id - The unique identifier of the agent.
     * @param parameters - The parameters for the agent update.
     * @returns The updated agent as a response DTO.
     */
    @HttpCode(200)
    @Put(':id')
    async update(@Param('id') id: string, @Body() parameters: UpdateAgentParametersDto): Promise<AgentDto> {
        return this.agentsService.update(id, parameters);
    }
}
