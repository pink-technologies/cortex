// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infraestructure/database';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      envFilePath: `env/.env.${process.env.NODE_ENV ?? 'development'}`,
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
