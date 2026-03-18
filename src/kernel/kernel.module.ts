// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { AgentsModule } from '@/agents/agents.module';
import { KernelService } from './service/kernel.service';

@Module({
  imports: [AgentsModule],
  providers: [KernelService],
  exports: [KernelService],
})
export class KernelModule { }
