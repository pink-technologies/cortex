// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ChatsModule } from '@/chats/chats.module';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infraestructure/database/index';
import { SkillsModule } from 'src/skills';
import { AgentsController } from './controller/index';
import {
  AgentsRepository,
  AgentsIntentRepository,
  AgentsSkillsRepository,
} from './repositories/index';
import {
  AgentsService,
  AgentsSkillsService,
  AgentRunService,
  OrchestratorService,
} from './service/index';

@Module({
  controllers: [AgentsController],
  imports: [DatabaseModule, SkillsModule, ChatsModule],
  exports: [
    AgentsRepository,
    AgentsService,
    OrchestratorService,
    AgentRunService,
  ],
  providers: [
    AgentsIntentRepository,
    AgentsRepository,
    AgentsSkillsRepository,
    OrchestratorService,
    AgentsService,
    AgentsSkillsService,
    AgentRunService,
  ],
})
export class AgentsModule { }
