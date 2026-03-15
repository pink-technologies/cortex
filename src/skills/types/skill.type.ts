// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { Prisma } from '@/infraestructure/database';

/**
 * Skill type that includes the `installations` relation.
 *
 * Use this type when a query uses `include: { installations: true }` so
 * TypeScript knows `skill.installations` is present (e.g. in the repository
 * return type and in DTOs that map installations).
 */
export type SkillWithInstallations = Prisma.SkillGetPayload<{
    include: {
        installations: true;
    };
}>;
