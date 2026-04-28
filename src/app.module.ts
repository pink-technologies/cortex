// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import {
  AcceptLanguageResolver,
  I18nJsonLoader,
  I18nModule,
} from 'nestjs-i18n';
import { AgentsModule } from './agents/agents.module';
import { CapabilitiesModule } from './capabilities';
import {
  DatabaseExceptionFilter,
  DatabaseModule,
} from './infraestructure/database';
import { StorageModule } from './infraestructure/storage/storage.module';
import { I18nModule as CortexI18nModule } from './i18n';
import { KernelModule } from './kernel/kernel.module';
// import { PlaygroundModule } from './playground/playground.module';
import { SkillsModule } from './skills/skills.module';
import { AuthenticationModule } from './authentication';
import { OrganizationsModule } from './organizations/organization.module';
import { UsersModule } from './users/users.module';

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
    AuthenticationModule,
    UsersModule,
    OrganizationsModule,
    AgentsModule,
    CapabilitiesModule,
    DatabaseModule,
    StorageModule,
    CortexI18nModule,
    SkillsModule,
    KernelModule,
    // PlaygroundModule,
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
