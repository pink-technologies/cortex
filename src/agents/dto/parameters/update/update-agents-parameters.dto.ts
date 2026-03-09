// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Data Transfer Object for agent update request input.
 *
 * Used at the controller boundary (e.g. HTTP request body) to validate and type
 * input for agent creation. The service maps this to
 * {@link UpdateAgentParameters} (e.g. adding ownerId from the authenticated
 * user) before calling the repository.
 *
 * Validation ensures the agent name and description are present and non-empty.
 */
export class UpdateAgentParametersDto {
    /**
     * The name of the agent.
     */
    @IsNotEmpty({ message: 'The agent name is required.' })
    @IsString()
    name: string;

    /**
     * The description of the agent.
     */
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'The agent description must be less than 255 characters.' })
    description?: string | null;
}
