// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { JobsService } from 'src/jobs/service/jobs.service';

@Module({
  imports: [JobsService],
  controllers: [],
  providers: [],
})
export class GatewayModule {}
