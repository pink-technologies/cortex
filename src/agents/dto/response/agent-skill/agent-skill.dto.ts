// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentSkill } from 'src/infraestructure/database';

/**
 * Data Transfer Object representing a skill returned to the client.
 *
 * This DTO exposes a read-only, sanitized view of the skill entity
 * suitable for API responses, decoupling the response shape from
 * the persistence model.
 */
export class AgentSkillDto {
    /**
     * Unique identifier of the agent.
     */
    readonly id: string;

    /**
     * Unique identifier of the agent.
     */
    readonly agentId: string;

    /**
     * Unique identifier of the skill.
     */
    readonly skillId: string;

    // Static methods

    /**
     * Creates a {@link AgentSkillDto} from a domain-level {@link AgentSkill}.
     *
     * @param agentSkill - The domain agent skill entity from the database layer.
     * @returns A response DTO suitable for API responses.
     */
    static from(agentSkill: AgentSkill): AgentSkillDto {
        return {
            id: agentSkill.id,
            agentId: agentSkill.agentId,
            skillId: agentSkill.skillId,
        };
    }
}
