// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for adding skills to an agent request input.
 *
 * Used at the controller boundary (e.g. HTTP request body) to validate and type
 * input for adding skills to an agent. The service maps this to
 * {@link AddSkillsToAgentParameters} before calling the repository.
 *
 * Validation ensures the skill ID is present and non-empty.
 */
export class AddSkillsToAgentParametersDto {
    /**
     * The unique identifier of the skill.
     */
    @IsNotEmpty({ message: 'The skill ID is required.' })
    @IsString()
    skillId: string;
}
