// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentsExceptionFilter } from 'src/agents/filter/exception.filter';
import { AgentsSkillsService } from 'src/agents/service/agents-skills/agents-skills.service';
import { AgentsSkillsResponseDto } from 'src/agents/dto/response/agents-skills/agents-skills.response.dto';
import { AddSkillsToAgentParametersDto } from 'src/agents/dto/parameters/create/agents-skills/add-skills-to-agent-parameters.dto';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Post,
    UseFilters,
} from '@nestjs/common';

/**
 * HTTP controller responsible for handling agents-related read requests.
 *
 * This controller acts as the transport-layer entry point for agents
 * operations and delegates all business logic to the {@link AgentsService}.
 */
@Controller('agents-skills')
@UseFilters(AgentsExceptionFilter)
export class AgentsSkillsController {
    // MARK: - Constructor

    /**
     * Creates a new {@link AgentsController}.
     *
     * @param agentsService - Application service responsible for
     * orchestrating agents-related read operations.
     */
    constructor(private readonly agentsSkillsService: AgentsSkillsService) { }

    // MARK: - Instance methods

    /**
     * Adds a skill to an agent.
     *
     * @param parameters - The parameters for the skill addition.
     * @returns The {@link AgentsSkillsResponseDto} entity.
     */
    @HttpCode(201)
    @Post('agent/:id')
    async addSkillsToAgent(@Param('id') agentId: string, @Body() parameters: AddSkillsToAgentParametersDto): Promise<string> {
        return this.agentsSkillsService.addSkill(agentId, parameters.skillId);
    }

    /**
     * Removes a skill from an agent.
     *
     * @param agentId - The unique identifier of the agent.
     * @param skillId - The unique identifier of the skill to remove.
     * @returns The {@link AgentsSkillsResponseDto} entity.
     */
    @HttpCode(200)
    @Delete('agent/:id/skill/:skillId')
    async removeSkillsFromAgent(
        @Param('id') agentId: string,
        @Param('skillId') skillId: string,
    ): Promise<string> {
        return this.agentsSkillsService.removeSkill(agentId, skillId);
    }

    /**
     * Retrieves all skills for an agent.
     *
     * @param agentId - The unique identifier of the agent.
     * @returns The {@link AgentsSkillsResponseDto} entities.
     */
    @HttpCode(200)
    @Get('agent/:id')
    async retrieveByAgentId(@Param('id') agentId: string): Promise<AgentsSkillsResponseDto[]> {
        return this.agentsSkillsService.retrieveByAgentId(agentId);
    }
}
