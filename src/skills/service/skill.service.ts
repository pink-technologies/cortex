// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { readFile, readdir } from "fs/promises";
import path from "path";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { DECODER, type Decoder } from "@/shared/types";
import { STORAGE, type Storage } from "@/infraestructure/storage";
import { SKILLS_BUNDLED_ROOT } from "../skill.tokens";
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
        @Inject(SKILLS_BUNDLED_ROOT)
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
        const entries = await readdir(this.skillsTomlPath, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue;
            }

            const filePath = path.join(this.skillsTomlPath, entry.name, "skill.toml");

            try {
                const raw = await readFile(filePath, "utf8");
                const schema = this.decoder.decode(raw, (v) => skillSchema.parse(v));        
                const skill = {
                    id: schema.id
                };

                if (await this.storage.read<Skill>(skill.id)) {
                    throw new SkillAlreadyRegisteredError();
                }

                await this.storage.write(skill, skill.id);
            } catch {
                throw new SkillFileLoadError();
            }
        }
    }
}
