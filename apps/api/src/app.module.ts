// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path'

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, RouterModule } from '@nestjs/core'
import { ApiConfigurationModule } from './configuration'
import { DatabaseExceptionFilter, DatabaseModule } from './infraestructure/database'
import { ExecutionModule } from './execution/execution.module'
import { I18nModule as CortexI18nModule } from './i18n'
import { NodesModule } from './nodes/nodes.module'
import { StorageModule } from './infraestructure/storage/storage.module'
import { WebhooksModule } from './webhooks'
import { WorkflowModule } from './workflow'
import {
  AcceptLanguageResolver,
  I18nJsonLoader,
  I18nModule,
} from 'nestjs-i18n'

@Module({
  controllers: [],
  imports: [
    ConfigModule.forRoot({
      envFilePath: `env/.env.${process.env.NODE_ENV ?? 'development'}`,
      isGlobal: true,
    }),
    ApiConfigurationModule,
    CortexI18nModule,
    DatabaseModule,
    ExecutionModule,
    NodesModule,
    StorageModule,
    WebhooksModule,
    WorkflowModule,
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
        module: NodesModule,
      },
    ]),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
  ],
})
export class AppModule {}
