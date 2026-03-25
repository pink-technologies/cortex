// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { Agent } from './agent';
import { AgentService, AGENT_IN_MEMORY_STORAGE } from './service/agent.service';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infraestructure/database/index';
import { InMemoryStorageService } from '@/infraestructure/storage/in-memory/in-memory.service';
import { TomlParse } from '@/shared/types';
import { SkillsModule } from '../skills/skills.module';

@Module({
  controllers: [],
  imports: [DatabaseModule, SkillsModule],
  exports: [AGENT_IN_MEMORY_STORAGE, AgentService],
  providers: [
    {
      provide: AGENT_IN_MEMORY_STORAGE,
      useFactory: () =>
        new InMemoryStorageService<Agent>(new Map<string, Agent>()),
    },
    TomlParse,
    AgentService,
  ],
})
export class AgentsModule { }
