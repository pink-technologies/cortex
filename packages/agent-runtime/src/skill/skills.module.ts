// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { Module } from '@nestjs/common';
import { DECODER, TomlDecoder } from '@/shared/types';
import { BUNDLED_SKILLS_PATH } from './tokens';
import { SkillService } from './service/skill/skill.service';
import { InMemoryStorageService, STORAGE } from '@/infraestructure/storage';
import { LLMModule } from '@/llm/llm.module';
import { TextSummarizeSkillExecutor } from './executors/summarize/text-summarize-skill.executor';

@Module({
  controllers: [],
  imports: [LLMModule],
  exports: [SkillService],
  providers: [
    SkillService,
    TextSummarizeSkillExecutor,
    {
      provide: BUNDLED_SKILLS_PATH,
      useFactory: () => path.join(process.cwd(), 'src', 'skills', 'bundled'),
    },
    {
      provide: DECODER,
      useClass: TomlDecoder,
    },
    {
      provide: STORAGE,
      useFactory: () => new InMemoryStorageService(new Map()), // TODO: Change to RedisStorageService
    },
  ],
})
export class SkillsModule {}
