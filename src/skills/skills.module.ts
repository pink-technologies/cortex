// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DECODER, TomlDecoder } from '@/shared/types';
import { BUNDLED_SKILLS_ROOT } from './skill.tokens';
import { SkillService } from './service/skill.service';
import { STORAGE } from '@/infraestructure/storage';
import { InMemoryStorageService } from '@/infraestructure/storage/in-memory/in-memory.service';
import { SkillRegistryService } from './service/registry/skill-registry.service';
import { LLMModule } from '@/llm/llm.module';
import { TextSummarizeSkillExecutor } from './executors/summarize/text-summarize-skill.executor';
import { SkillBootstrapService } from './service/skill-bootstrap.service';

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
            provide: BUNDLED_SKILLS_ROOT,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const raw = config.get<string>('BUNDLED_SKILLS_ROOT')?.trim();
                const hasExistingPath = raw && raw.length > 0
                const root = hasExistingPath ? raw : path.join('src', 'skills', 'bundled');
                return path.isAbsolute(root) ? root : path.join(process.cwd(), root);
            },
        },
        { provide: DECODER, useClass: TomlDecoder },
        SkillService,
        SkillRegistryService,
        TextSummarizeSkillExecutor,
        SkillBootstrapService,
    ],
})
export class SkillsModule { }