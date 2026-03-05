// https://pink-tech.io/

import { Prisma } from "src/infraestructure/database";

/**
 * Skill payload type that includes the `installations` relation.
 *
 * Use this type when:
 * - a repository method queries `Skill` with `skillWithInstallationsArgs.include`,
 * - a service/DTO needs to access `skill.installations` safely.
 *
 * This avoids typing those methods as base `Skill`, which would hide relation
 * fields at compile time even if they are present at runtime.
 */
export type Skill = Prisma.SkillGetPayload<{
    include: {
        installations: true;
    };
}>;