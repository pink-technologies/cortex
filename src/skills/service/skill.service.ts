// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { readFile, readdir } from "fs/promises";
import path from "path";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { DECODER, type Decoder } from "@/shared/types";
import { STORAGE, type Storage } from "@/infraestructure/storage";
import { BUNDLED_SKILLS_ROOT } from "../skill.tokens";
import { skillSchema } from "../schema/skill.schema";
import { SkillAlreadyRegisteredError, SkillFileLoadError } from "./error/error";
import { Skill } from "../skill";

/**
 * Loads skills from TOML files under the directory injected as {@link SKILLS_BUNDLED_ROOT}
 * (wired in `SkillsModule` from `SKILLS_BUNDLED_ROOT` in env — same pattern as `REDIS_URL` in `StorageModule`).
 */
@Injectable()
export class SkillService implements OnModuleInit {
    // MARK: - Constructor

    /**
     * Wires bundled skill root, TOML decoding, and persistence used when {@link load} registers each {@link Skill}.
     *
     * Token bindings are defined in {@link SkillsModule} (`STORAGE`, {@link DECODER}, {@link SKILLS_BUNDLED_ROOT}).
     *
     * @param skillsTomlPath - Injected via {@link SKILLS_BUNDLED_ROOT}; absolute directory scanned for subfolders containing `skill.toml`.
     * @param decoder - Injected via {@link DECODER} as {@link Decoder}; parses skill `.toml` (syntax) and optional refine step (e.g. Zod).
     * @param storage - Injected via {@link STORAGE}; stores and loads {@link Skill} instances by id after {@link load}.
     */
    constructor(
        @Inject(BUNDLED_SKILLS_ROOT)
        private readonly skillsTomlPath: string,
        @Inject(DECODER)
        private readonly decoder: Decoder,
        @Inject(STORAGE)
        private readonly storage: Storage,
    ) {}

    // MARK: - OnModuleInit

    /**
     * Loads the skill from the TOML file when the module boots.
     */
    async onModuleInit(): Promise<void> {
        await this.loadAndRegisterSkills();
    }

    // MARK: - Private methods

    private async loadAndRegisterSkills(): Promise<void> {
        const skillFiles = await this.findSkillTomls(this.skillsTomlPath);

        for (const filePath of skillFiles) {
            try {
                const raw = await readFile(filePath, "utf8");
        
                const schema = this.decoder.decode(raw, (v) =>
                    skillSchema.parse(v),
                );
        
                const skillDir = path.dirname(filePath);
        
                const promptTemplate = await readFile(path.join(skillDir, "skill.md"), "utf8");

                if (await this.storage.read<Skill>(schema.id)) {
                    throw new SkillAlreadyRegisteredError();
                }

                await this.storage.write({
                    ...schema,
                    promptTemplate,
                }, 
                schema.id
            );
            } catch {
                throw new SkillFileLoadError();
            }
        }
    }

    // MARK: - Private methods

    private async findSkillTomls(dir: string): Promise<string[]> {
        const entries = await readdir(dir, { withFileTypes: true });

        const results: string[] = [];

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                results.push(...(await this.findSkillTomls(fullPath)));
            } else if (entry.name === "skill.toml") {
                results.push(fullPath);
            }
        }

        return results;
    }
}
