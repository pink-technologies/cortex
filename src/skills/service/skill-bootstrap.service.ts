// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable, OnModuleInit } from "@nestjs/common";
import { SkillRegistryService } from "./registry/skill-registry.service";
import { TextSummarizeSkillExecutor } from "../executors/summarize/text-summarize-skill.executor";

/**
 * Registers all skill instances into {@link SkillRegistryService} at module init.
 */
@Injectable()
export class SkillBootstrapService implements OnModuleInit {

    // MARK: - Constructor
    
    /**
     * Creates a new {@link SkillBootstrapService}.
     *
     * @param skillRegistryService - The skill registry service.
     * @param textSummarizeSkillService - The text summarize skill service.
     */
    constructor(
        private readonly skillRegistryService: SkillRegistryService,
        private readonly textSummarizeSkillExecutor: TextSummarizeSkillExecutor,
    ) { }

    // MARK: - OnModuleInit

    /**
     * Bootstraps the skill registry.
     */
    async onModuleInit() {
        this.skillRegistryService.register(
            this.textSummarizeSkillExecutor.id,
            () => this.textSummarizeSkillExecutor,
        );
    }
}