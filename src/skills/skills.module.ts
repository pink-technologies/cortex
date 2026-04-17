// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LLMModule } from '@/llm/llm.module';
import { InMemoryStorageService } from '@/infraestructure/storage/service/in-memory/in-memory.service';
import { STORAGE } from '@/infraestructure/storage/storage.tokens';
import { TomlParser } from '@/shared/types';
import { SKILLS_BUNDLED_ROOT } from './skill.tokens';
import { SkillService } from './service/skill.service';
import { SkillRegistryService } from './service/registry/skill-registry.service';
import { SkillsBootstrapService } from './service/skills-bootstrap.service';
import { TextSummarizeSkillService } from './executors/summarize/text-summarize-skill.service';

@Module({
    controllers: [],
    imports: [ConfigModule, LLMModule],
    exports: [SkillService, SkillRegistryService],
    providers: [
        {
            provide: STORAGE,
            useFactory: () =>
                new InMemoryStorageService(new Map()),
        },
        {
            provide: SKILLS_BUNDLED_ROOT,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const raw = config.get<string>('SKILLS_BUNDLED_ROOT')?.trim();
                const hasExistingPath = raw && raw.length > 0
                const root = hasExistingPath ? raw : path.join('src', 'skills', 'bundled');
                return path.isAbsolute(root) ? root : path.join(process.cwd(), root);
            },
        },
        TomlParser,
        SkillService,
        SkillRegistryService,
        TextSummarizeSkillService,
        SkillsBootstrapService,
    ],
})
export class SkillsModule { }