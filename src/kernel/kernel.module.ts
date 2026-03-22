// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { AgentsModule } from '@/agents/agents.module';
import { DECISION_EXECUTOR, KernelDecisionExecutor } from './executor/desicion-executor';
import { Kernel } from './kernel';

@Module({
  imports: [AgentsModule],
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
