// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AgentsModule } from './agents/agents.module';
import { CapabilitiesModule } from './capabilities';
import { StorageModule } from './infraestructure/storage/storage.module';
import { I18nModule as CortexI18nModule } from './i18n';
import { KernelModule } from './kernel/kernel.module';
import { SkillsModule } from './skills/skills.module';
import { AuthenticationModule } from './gateway/authentication';
import { UsersModule } from './gateway/users/users.module';
import {
  DatabaseExceptionFilter,
  DatabaseModule,
} from './infraestructure/database';
import { GlobalExceptionFilter } from './shared/filter/exception.filter';
import {
  AcceptLanguageResolver,
  I18nJsonLoader,
  I18nModule,
  I18nValidationExceptionFilter,
} from 'nestjs-i18n';

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
    UsersModule,
    AuthenticationModule,
    AgentsModule,
    CapabilitiesModule,
    DatabaseModule,
    StorageModule,
    CortexI18nModule,
    SkillsModule,
    KernelModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useFactory: () =>
        new I18nValidationExceptionFilter({ detailedErrors: true }),
    },
  ],
})
export class AppModule { }
