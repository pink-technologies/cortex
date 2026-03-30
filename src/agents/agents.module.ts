// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@/infraestructure/database/index';
import { InMemoryStorageService } from '@/infraestructure/storage/service/in-memory/in-memory.service';
import { STORAGE } from '@/infraestructure/storage/storage.tokens';
import { TomlParser } from '@/shared/types';
import type { LLM } from '@/llm/llm';
import { LLMModule } from '@/llm/llm.module';
import { LLM_TOKEN } from '@/llm/llm.tokens';
import { SkillsModule } from '../skills/skills.module';
import { AgentRole } from './agent';
import { PromptDrivenAgent } from './decision/prompt-driven-agent';
import { AGENTS_BUNDLED_ROOT } from './agents.tokens';
import { AgentService } from './service/agent.service';

/** Default model when `agent.toml` does not specify one (aligned with {@link OpenAIProvider} defaults). */
// TODO: Not implemented yet
const DEFAULT_LLM_MODEL = '' as const;

@Module({
  controllers: [],
  imports: [ConfigModule, DatabaseModule, LLMModule, SkillsModule],
  exports: [AgentService, STORAGE, PromptDrivenAgent],
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
        const root = hasExistingPath ? raw : path.join('src', 'agents', 'bundled');
        return path.isAbsolute(root) ? root : path.join(process.cwd(), root);
      },
    },
    TomlParser,
    {
      provide: PromptDrivenAgent,
      inject: [LLM_TOKEN],
      useFactory: (llm: LLM) =>
        new PromptDrivenAgent(
          '__default__',
          {
            name: 'Default',
            role: AgentRole.Assistant,
            allowedSkillIds: [],
            capabilities: [],
          },
          '',
          llm,
          DEFAULT_LLM_MODEL,
          [],
        ),
    },
    AgentService,
  ],
})
export class AgentsModule { }
