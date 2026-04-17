// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from "@nestjs/common";
import { SkillExecutor } from "@/skills/executors/skill-executor";
import { SkillFactory } from "@/skills/skill";

/**
 * In-memory registry of skills based on the Factory Pattern.
 */
@Injectable()
export class SkillRegistryService {
    // MARK: - Private properties

    private readonly skills = new Map<string, SkillFactory>();

    // MARK: - SkillRegistryService

    /**
     * Registers a skill factory by id.
     *
     * @param id - The id of the skill.
     * @param factory - The factory for the skill.
     */
    register(id: string, factory: SkillFactory): void {
        this.skills.set(id, factory);
    }

    /**
     * Gets a skill executor by id.
     *
     * @param id - The id of the skill.
     * @returns The skill executor.
     * @throws {@link Error} If the skill is not found.
     */
    get(id: string): SkillExecutor {
        const factory = this.skills.get(id);

        if (!factory) throw new Error(`Skill not found: ${id}`);

        return factory();
    }
}