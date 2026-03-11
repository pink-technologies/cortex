// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { SkillInstallation } from 'src/infraestructure/database';

/**
 * Data Transfer Object representing a skill installation returned to the client.
 */
export class SkillInstallationResponseDto {
    /**
     * Unique identifier of the skill installation.
     */
    readonly id: string;

    /**
     * Related skill identifier.
     */
    readonly skillId: string;

    /**
     * Installation scope type.
     */
    readonly scopeType: string;

    /**
     * Installation scope identifier.
     */
    readonly scopeId: string;

    /**
     * Optional installation path.
     */
    readonly installationPath: string | null;

    /**
     * Installation status.
     */
    readonly status: string;

    /**
     * Optional installation configuration.
     */
    readonly config: unknown;

    /**
     * Optional installation actor.
     */
    readonly installedBy: string | null;

    /**
     * Date and time when the skill was installed.
     */
    readonly installedAt: Date;

    /**
     * Date and time when the installation record was created.
     */
    readonly createdAt: Date;

    /**
     * Date and time when the installation record was last updated.
     */
    readonly updatedAt: Date;

    /**
     * Creates a {@link SkillInstallationResponseDto} from a {@link SkillInstallation}.
     *
     * @param installation - Skill installation entity from persistence.
     * @returns Response DTO ready for transport.
     */
    static from(installation: SkillInstallation): SkillInstallationResponseDto {
        return {
            id: installation.id,
            skillId: installation.skillId,
            scopeType: installation.scopeType,
            scopeId: installation.scopeId,
            installationPath: installation.installationPath,
            status: installation.status,
            config: installation.config,
            installedBy: installation.installedBy,
            installedAt: installation.installedAt,
            createdAt: installation.createdAt,
            updatedAt: installation.updatedAt,
        };
    }
}
