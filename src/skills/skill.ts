// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { SkillExecutor } from "./executors/skill-executor";

/**
 * A factory for a skill executor.
 */
export type SkillFactory = () => SkillExecutor;

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

    /**
     * Display name from bundled `skill.toml` (see {@link SkillService}).
     */
    readonly name?: string;

    /**
     * Short description from bundled `skill.toml`.
     */
    readonly description?: string;

    /**
     * Input schema kind from `skill.toml` `[input].schema` (e.g. `json`).
     */
    readonly inputSchema?: string;

    /**
     * Markdown loaded from `skill.md` next to `skill.toml` when that file exists (see {@link SkillService}).
     */
    readonly promptTemplate?: string;
}

/**
 * A registered skill: stable id.
 *
 * Implementations are stored in {@link SkillRegistry} and invoked by the kernel or orchestrator
 * after resolving which skill should act.
 */
export interface SkillEntry {
    /**
     * The id of the skill.
     */
    id: string;
}
