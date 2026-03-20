// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AcceptLanguageResolver, I18nJsonLoader, I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import { AgentsModule } from './agents';
import { DatabaseExceptionFilter } from './infraestructure/database';
import { DatabaseModule } from './infraestructure/database';
import { StorageModule } from './infraestructure/storage/storage.module';
import { I18nModule as CortexI18nModule } from './i18n';
import { SkillsModule } from './skills';
import { ToolsModule } from './tools/tools.module';
import { KernelModule } from './kernel';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `env/.env.${process.env.NODE_ENV ?? 'development'}`,
      isGlobal: true,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loader: I18nJsonLoader,
      resolvers: [AcceptLanguageResolver],
      fallbacks: {
        'en-*': 'en',
        'es-*': 'es',
      },
      loaderOptions: {
        path: path.join(__dirname, 'i18n', 'locales'),
        watch: true,
      },
    }),
    AgentsModule,
    DatabaseModule,
    StorageModule,
    CortexI18nModule,
    SkillsModule,
    ToolsModule,
    KernelModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
  ],
})
export class AppModule { }
