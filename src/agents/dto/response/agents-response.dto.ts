// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Agent } from 'src/infraestructure/database';

/**
 * Data Transfer Object representing an agent returned to the client.
 *
 * This DTO exposes a read-only, sanitized view of the agent entity
 * suitable for API responses, decoupling the response shape from
 * the persistence model.
 */
export class AgentsResponseDto {
    /**
     * Unique identifier of the agent.
     */
    readonly id: string;

    /**
     * Human-readable name of the agent.
     */
    readonly name: string;

    /**
     * Optional description of the agent.
     */
    readonly description: string | null;

    /**
     * Current status of the agent (e.g. ACTIVE, DEPRECATED).
     */
    readonly status: string;

    /**
     * Date and time when the agent was created.
     */
    readonly createdAt: Date;

    /**
     * Date and time when the agent was last updated.
     */
    readonly updatedAt: Date;

    // Static methods

    /**
     * Creates a {@link AgentsResponseDto} from a domain-level {@link Agent}.
     *
     * This method acts as a mapping boundary between the domain
     * entity and the API response layer.
     *
     * @param agent - The domain agent entity from the database layer.
     * @returns A response DTO suitable for API responses.
     */
    static from(agent: Agent): AgentsResponseDto {
        return {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            status: agent.status,
            createdAt: agent.createdAt,
            updatedAt: agent.updatedAt,
        };
    }
}
