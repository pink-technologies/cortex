// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';

@Module({
  exports: [JobsService],
  providers: [JobsService],
})
export class JobsModule { }
