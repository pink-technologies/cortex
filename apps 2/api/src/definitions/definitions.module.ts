// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path'
import { Module } from '@nestjs/common'
import { AgentsLoader } from './services/agent/loader/agents-loader'
import { CapabilitiesLoader } from './services/capability/loader/capabilities-loader'
import { DECODER, TomlDecoder } from '@/shared/types'
import { SkillsLoader } from './services/skill/loader/skills-loader'
import { 
  AgentDefinitionService,
  CapabilityDefinitionService, 
  SkillDefinitionService, 
  DefinitionService 
} from './services'

import {
  BUNDLED_AGENTS_PATH,
  BUNDLED_CAPABILITIES_PATH,
  BUNDLED_SKILLS_PATH,
} from './tokens';

@Module({
  controllers: [],  
  imports: [],
  exports: [
    AgentDefinitionService, 
    DefinitionService, 
    CapabilityDefinitionService, 
    SkillDefinitionService
  ],
  providers: [
    AgentDefinitionService,
    CapabilityDefinitionService,
    SkillDefinitionService,
    DefinitionService,
    AgentsLoader,
    CapabilitiesLoader,
    SkillsLoader,
    {
      provide: BUNDLED_AGENTS_PATH,
      useFactory: () => {
        return path.join(
          process.cwd(),
          'src',
          'definitions',
          'bundled',
          'agents',
        );
      },
    },
    {
      provide: BUNDLED_CAPABILITIES_PATH,
      useFactory: () => {
        return path.join(
          process.cwd(),
          'src',
          'definitions',
          'bundled',
          'capabilities',
        );
      },
    },
    {
      provide: BUNDLED_SKILLS_PATH,
      useFactory: () => {
        return path.join(
          process.cwd(),
          'src',
          'definitions',
          'bundled',
          'skills',
        );
      },
    },
    {
      provide: DECODER,
      useClass: TomlDecoder,
    },
  ],
})
export class DefinitionsModule {}
