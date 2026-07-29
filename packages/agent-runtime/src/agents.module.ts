// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { InMemoryStorageService } from '@/infraestructure/storage/in-memory/in-memory.service'
import { LLMModule } from '@/llm/llm.module'
import { SkillsModule } from '../skills/skills.module'
import { AgentFactory } from './legacy/runtime/agent-factory'
import { BUNDLED_AGENTS_PATH, LLM_FACTORY } from '../../bundled/tokens'
import { AgentService } from './legacy/service/agent/agent.service'
import { DECODER, TomlDecoder } from '@/shared/types'
import { LLMFactoryImpl } from '@/llm'

@Module({
  controllers: [],
  imports: [ConfigModule, LLMModule, SkillsModule],
  exports: [AgentFactory],
  providers: [
    AgentFactory,    
    AgentService,
    {
      provide: BUNDLED_AGENTS_PATH,
      useFactory: () => path.join(process.cwd(), 'src', 'agents', 'bundled'),
    },
    { 
      provide: DECODER, 
      useClass: TomlDecoder 
    },
    { 
      provide: LLM_FACTORY, 
      useClass: LLMFactoryImpl 
    }
  ],
})
export class AgentsModule {}
