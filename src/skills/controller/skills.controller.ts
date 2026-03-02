// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Skill } from 'src/infraestructure/database';
import { SkillsService } from '../service/skills.service';
import {
    Controller,
    Get,
    HttpCode,
    Param,
    Query,
} from '@nestjs/common';

/**
 * HTTP controller responsible for handling skill-related read requests.
 *
 * This controller acts as the transport-layer entry point for skill
 * operations and delegates all business logic to the {@link SkillsService}.
 */
@Controller()
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
     * @returns The matching skill entity.
     *
     * @throws HttpException If the operation fails due to:
     * - Missing or invalid ID
     * - The requested skill not being found
     */
    @HttpCode(200)
    @Get('skills/:id')
    async findById(@Param('id') id: string): Promise<Skill> {
        return this.skillsService.findById(id);
    }

    /**
     * Finds a single skill by name.
     *
     * This endpoint fetches the detailed profile of a specific skill using
     * its human-readable name.
     *
     * A successful operation returns **200 OK** with the matching skill.
     *
     * @param name - The exact name of the skill to search for.
     *
     * @returns The matching skill entity.
     *
     * @throws HttpException If the operation fails due to:
     * - The requested skill not being found
     */
    @HttpCode(200)
    @Get('skills/:name')
    async findByName(@Param('name') name: string): Promise<Skill> {
        return this.skillsService.findByName(name);
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
    @Get('skills/check/registered')
    async isSkillRegistered(@Query('name') name: string): Promise<{ message: string }> {
        return this.skillsService.isSkillRegistered(name);
    }

    /**
     * Retrieves all skills.
     *
     * This endpoint returns a catalog of all available skills in the system.
     *
     * A successful operation returns **200 OK** with an array of skills.
     *
     * @returns An array of all registered skills.
     */
    @HttpCode(200)
    @Get()
    async retrieve(): Promise<Skill[]> {
        return this.skillsService.retrieve();
    }
}
