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
import { BUNDLED_AGENTS_PATH, } from './tokens';
import { AgentService } from './service/agent.service';
import { DECODER, TomlDecoder } from '@/shared/types';
import { AgentLoader } from './loader/agent-loader';

@Module({
  controllers: [],
  imports: [ConfigModule, DatabaseModule, LLMModule, SkillsModule],
  exports: [STORAGE],
  providers: [
    AgentLoader,
    AgentService,
    { provide: DECODER, useClass: TomlDecoder },
    {
      provide: STORAGE,
      useFactory: () => new InMemoryStorageService(new Map()),
    },
    {
      provide: BUNDLED_AGENTS_PATH,
      inject: [ConfigService],
      useFactory: () => path.join(process.cwd(), 'src', 'agents', 'bundled')
      ,
    },
  ],
})
export class AgentsModule {}