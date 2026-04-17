// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { readFile, readdir } from "fs/promises";
import path from "path";

import { Inject, Injectable, OnModuleInit } from "@nestjs/common";

import { TomlParser } from "@/shared/types";

import { SkillSchema, skillSchema } from "../schema/skill.schema";
import type { Storage } from "@/infraestructure/storage/storage";
import { STORAGE } from "@/infraestructure/storage/storage.tokens";
import { SKILLS_BUNDLED_ROOT } from "../skill.tokens";
import { Skill } from "../skill";

import { SkillAlreadyRegisteredError, SkillFileLoadError } from "./error/error";

/**
 * Loads skills from TOML files under the directory injected as {@link SKILLS_BUNDLED_ROOT}
 * (wired in `SkillsModule` from `SKILLS_BUNDLED_ROOT` in env — same pattern as `REDIS_URL` in `StorageModule`).
 */
@Injectable()
export class SkillService implements OnModuleInit {
    // MARK: - Constructor

    /**
     * @param storage - Storage service for capabilities.
     * @param tomlParser - Toml parser for capabilities.
     * @param capabilitiesTomlPath - Absolute path to the directory that contains the capabilities.
     */
    constructor(
        @Inject(STORAGE)
        private readonly storage: Storage,
        private readonly tomlParser: TomlParser,
        @Inject(SKILLS_BUNDLED_ROOT)
        private readonly skillsTomlPath: string,
    ) { }

    // MARK: - OnModuleInit

    /**
     * Loads bundled skills from disk when the module boots.
     */
    async onModuleInit(): Promise<void> {
        await this.load();
    }

    // MARK: - Instance methods

    /**
     * Loads the capabilities from the TOML files under the directory
     * injected as {@link SKILLS_BUNDLED_ROOT}. Discovers every `skill.toml`
     * at any depth (e.g. `bundled/text/summarize/skill.toml`).
     */
    async load(): Promise<void> {
        const filePaths = await this.findSkillTomlFiles(this.skillsTomlPath);

        for (const filePath of filePaths) {
            try {
                await this.loadSkillFromFile(filePath);
            } catch {
                throw new SkillFileLoadError();
            }
        }
    }

    // MARK: - Private methods

    private async findSkillTomlFiles(root: string): Promise<string[]> {
        const results: string[] = [];
        const entries = await readdir(root, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(root, entry.name);
            if (entry.isDirectory()) {
                results.push(...(await this.findSkillTomlFiles(fullPath)));
            } else if (entry.name === "skill.toml") {
                results.push(fullPath);
            }
        }

        return results;
    }

    private async loadSkillFromFile(filePath: string): Promise<Skill> {
        const raw = await readFile(filePath, "utf8");
        const parsed = this.tomlParser.parser<unknown>(raw);
        const dto = skillSchema.parse(parsed);
        const schema = SkillSchema.from(dto);
        const skillDir = path.dirname(filePath);
        const promptTemplate = await this.tryReadSkillMarkdown(skillDir);
        const skill = this.schemaToSkill(schema, promptTemplate);

        if (await this.storage.read<Skill>(skill.id)) {
            throw new SkillAlreadyRegisteredError();
        }

        await this.storage.write(skill, skill.id);

        return skill;
    }

    private async tryReadSkillMarkdown(skillDir: string): Promise<string | undefined> {
        const promptPath = path.join(skillDir, "skill.md");
        try {
            return await readFile(promptPath, "utf8");
        } catch {
            return undefined;
        }
    }

    private schemaToSkill(skill: SkillSchema, promptTemplate?: string): Skill {
        const schema = skill.schema;

        return {
            id: schema.id,
            name: schema.name,
            description: schema.description,
            inputSchema: schema.input.schema,
            ...(promptTemplate !== undefined ? { promptTemplate } : {}),
        };
    }

    /**
     * Returns a skill record previously loaded into {@link STORAGE}, or null if missing.
     */
    async findById(id: string): Promise<Skill | null> {
        return this.storage.read<Skill>(id);
    }
}