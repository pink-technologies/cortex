// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@/infraestructure/database/index';
import { InMemoryStorageService } from '@/infraestructure/storage/in-memory/in-memory.service';
import { STORAGE } from '@/infraestructure/storage';
import { LLMModule } from '@/llm/llm.module';
import { SkillsModule } from '../skills/skills.module';
import { AGENT, BUNDLED_AGENTS_PATH, BUNDLED_AGENTS_PATH_KEY } from './agents.tokens';
import { AgentService } from './service/agent.service';
import { DECODER, TomlDecoder } from '@/shared/types';

@Module({
  controllers: [],
  imports: [ConfigModule, DatabaseModule, LLMModule, SkillsModule],
  exports: [AgentService, STORAGE, AGENT],
  providers: [
    { provide: DECODER, useClass: TomlDecoder },
    AgentService,
    {
      provide: AGENT,
      inject: [AgentService],
      useFactory: (agentService: AgentService) => agentService.getMainAssistant(),
    },
    {
      provide: STORAGE,
      useFactory: () => new InMemoryStorageService(new Map()),
    },
    {
      provide: BUNDLED_AGENTS_PATH,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const raw = config.get<string>(BUNDLED_AGENTS_PATH_KEY)?.trim();
        const hasExistingPath = raw && raw.length > 0;
        const root = hasExistingPath ? raw : path.join('src', 'agents', 'bundled');
        return path.isAbsolute(root) ? root : path.join(process.cwd(), root);
      },
    },
  ],
})
export class AgentsModule {}
