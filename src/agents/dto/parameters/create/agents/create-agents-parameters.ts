// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Data Transfer Object for agent creation request input.
 *
 * Used at the controller boundary (e.g. HTTP request body) to validate and type
 * input for agent creation. The service maps this to
 * {@link CreateAgentParameters} (e.g. adding ownerId from the authenticated
 * user) before calling the repository.
 *
 * Validation ensures the agent name is present and non-empty.
 */
export class CreateAgentParametersDto {
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
    description?: string | null;
}
