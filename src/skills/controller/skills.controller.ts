// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { SkillResponseDto } from '../dtos/response/skill-response.dto';
import { SkillsService } from '../service/skills.service';
import { SkillServiceExceptionFilter } from '../filter/exception.filter';
import type { SkillsQuery } from '../types/skills-query.type';
import {
    Controller,
    Get,
    HttpCode,
    Param,
    Query,
    UseFilters,
} from '@nestjs/common';

/**
 * HTTP controller responsible for handling skill-related read requests.
 *
 * This controller acts as the transport-layer entry point for skill
 * operations and delegates all business logic to the {@link SkillsService}.
 */
@Controller('skills')
@UseFilters(SkillServiceExceptionFilter)
export class SkillsController {
    // MARK: - Constructor

    /**
     * Creates a new {@link SkillsController}.
     *
     * @param skillsService - Application service responsible for
     * orchestrating skill-related read operations.
     */
    constructor(private readonly skillsService: SkillsService) { }

    // MARK: - Instance methods

    /**
     * Finds a single skill by id.
     *
     * This endpoint fetches the detailed profile of a specific skill using
     * its unique identifier.
     *
     * A successful operation returns **200 OK** with the matching skill.
     *
     * @param id - The unique identifier of the skill to search for.
     *
     * @returns The matching skill as a response DTO.
     *
     * @throws HttpException If the operation fails due to:
     * - Missing or invalid ID
     * - The requested skill not being found
     */
    @HttpCode(200)
    @Get('id/:id')
    async findById(@Param('id') id: string): Promise<SkillResponseDto> {
        return this.skillsService.findById(id);
    }

    /**
     * Checks whether a skill name is already registered.
     *
     * This endpoint performs a validation check against the database to
     * determine if the provided skill name already exists.
     *
     * A successful operation returns **200 OK** with a descriptive message.
     *
     * @param name - The skill name to check.
     *
     * @returns An object containing a status message.
     */
    @HttpCode(200)
    @Get('check/registered')
    async isSkillRegistered(@Query('name') name: string): Promise<{ message: string }> {
        return this.skillsService.isSkillRegistered(name);
    }

    /**
     * Retrieves skills with optional filters and pagination.
     *
     * Query params (all optional):
     * - name: filters by skill name (contains, case-insensitive)
     * - page: 1-based page number
     * - size: items per page
     *
     * @param query - Query parameters for filtering/pagination
     * @returns Array of skills as response DTOs
     */
    @HttpCode(200)
    @Get()
    async retrieve(
        @Query() query: SkillsQuery,
    ): Promise<SkillResponseDto[]> {
        return this.skillsService.retrieve(query);
    }
}
