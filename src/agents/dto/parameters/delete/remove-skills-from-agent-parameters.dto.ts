// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for removing skills from an agent request input.
 *
 * Used at the controller boundary (e.g. HTTP request body) to validate and type
 * input for removing skills from an agent. The service maps this to
 * {@link RemoveSkillsFromAgentParameters} before calling the repository.
 *
 * Validation ensures the skill ID is present and non-empty.
 */
export class RemoveSkillsFromAgentParametersDto {
    /**
     * The unique identifier of the skill.
     */
    @IsNotEmpty({ message: 'The skill ID is required.' })
    @IsString()
    skillId: string;
}
