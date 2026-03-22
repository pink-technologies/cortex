// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infraestructure/database/index';
import { SkillsModule } from 'src/skills';
import {
  AGENT_REGISTRY,
  InMemoryAgentRegistry,
} from './registry/agent-registry';

@Module({
  controllers: [],
  imports: [DatabaseModule, SkillsModule],
  exports: [AGENT_REGISTRY],
  providers: [
    {
      provide: AGENT_REGISTRY,
      useClass: InMemoryAgentRegistry,
    },
  ],
})
export class AgentsModule {}
