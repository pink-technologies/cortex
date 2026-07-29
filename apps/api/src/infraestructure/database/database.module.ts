// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Global, Module } from '@nestjs/common';
import { Database } from './database';

@Global()
@Module({
  exports: [Database],
  providers: [Database],
})
export class DatabaseModule {}
