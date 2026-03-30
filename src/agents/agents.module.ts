// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@/infraestructure/database/index';
import { InMemoryStorageService } from '@/infraestructure/storage/service/in-memory/in-memory.service';
import { STORAGE } from '@/infraestructure/storage/storage.tokens';
import { TomlParser } from '@/shared/types';
import { LLMModule } from '@/llm/llm.module';
import { SkillsModule } from '../skills/skills.module';
import { AGENTS_BUNDLED_ROOT } from './agents.tokens';
import { AgentService } from './service/agent.service';

@Module({
  controllers: [],
  imports: [ConfigModule, DatabaseModule, LLMModule, SkillsModule],
  exports: [AgentService, STORAGE],
  providers: [
    {
      provide: STORAGE,
      useFactory: () => new InMemoryStorageService(new Map()),
    },
    {
      provide: AGENTS_BUNDLED_ROOT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const raw = config.get<string>('AGENTS_BUNDLED_ROOT')?.trim();
        const hasExistingPath = raw && raw.length > 0;
        const root = hasExistingPath
          ? raw
          : path.join('src', 'agents', 'bundled');
        return path.isAbsolute(root) ? root : path.join(process.cwd(), root);
      },
    },
    TomlParser,
    AgentService,
  ],
})
export class AgentsModule {}
