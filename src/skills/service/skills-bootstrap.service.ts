// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable, OnModuleInit } from "@nestjs/common";
import { SkillRegistryService } from "./registry/skill-registry.service";
import { TextSummarizeSkillService } from "../executors/summarize/text-summarize-skill.service";

/**
 * Registers all skill instances into {@link SkillRegistryService} at module init.
 */
@Injectable()
export class SkillsBootstrapService implements OnModuleInit {

    // MARK: - Constructor

    /**
     * Creates a new {@link SkillsBootstrapService}.
     *
     * @param skillRegistryService - The skill registry service.
     * @param textSummarizeSkillService - The text summarize skill service.
     */
    constructor(
        private readonly skillRegistryService: SkillRegistryService,
        private readonly textSummarizeSkillService: TextSummarizeSkillService,
    ) { }

    // MARK: - OnModuleInit

    /**
     * Bootstraps the skill registry.
     */
    async onModuleInit() {
        this.skillRegistryService.register(
            this.textSummarizeSkillService.id,
            () => this.textSummarizeSkillService,
        );
    }
}
