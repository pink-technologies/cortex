// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { AgentsModule } from '@/agents/agents.module';
import { CapabilitiesModule } from '@/capabilities/capabilities.module';
import { SkillsModule } from '@/skills/skills.module';
import { DECISION_EXECUTOR, KernelDecisionExecutor } from './executor/decision-executor';
import { Kernel } from './kernel';

@Module({
  imports: [AgentsModule, CapabilitiesModule, SkillsModule],
  providers: [
    Kernel,
    {
      provide: DECISION_EXECUTOR,
      useClass: KernelDecisionExecutor,
    }
  ],
  exports: [Kernel],
})
export class KernelModule { }