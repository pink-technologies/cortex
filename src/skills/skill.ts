// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * A registered skill: stable id.
 *
 * Implementations are stored in {@link SkillRegistry} and invoked by the kernel or orchestrator
 * after resolving which skill should act.
 */
export interface Skill {
    /**
     * Stable key used in {@link SkillRegistry}.
     */
    readonly id: string;
}
