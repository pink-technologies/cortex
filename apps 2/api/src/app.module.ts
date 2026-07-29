// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, RouterModule } from '@nestjs/core';
import { AgentsModule } from './agents/agents.module'
import { CapabilitiesModule } from './capabilities'
import { DatabaseExceptionFilter, DatabaseModule } from './infraestructure/database'
import { DefinitionsModule } from './definitions'
import { ExecutionModule } from './execution/execution.module'
import { StorageModule } from './infraestructure/storage/storage.module'
import { I18nModule as CortexI18nModule } from './i18n'
import { KernelModule } from './kernel/kernel.module'
import {
  AcceptLanguageResolver,
  I18nJsonLoader,
  I18nModule,
} from 'nestjs-i18n'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `env/.env.${process.env.NODE_ENV ?? 'development'}`,
      isGlobal: true,
    }),
    AgentsModule,
    CapabilitiesModule,
    CortexI18nModule,
    DatabaseModule,
    DefinitionsModule,
    ExecutionModule,
    KernelModule,
    StorageModule,
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
    RouterModule.register([
      {
        path: 'internal',
        module: ExecutionModule,
      },
    ]),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
  ],
})
export class AppModule {}
