// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { UsersModule } from '@/gateway/users/users.module'
import { AuthModule } from '@/infraestructure/auth/auth.module'
import { DatabaseModule } from '@/infraestructure/database'
import { StorageModule } from '@/infraestructure/storage/storage.module'
import { TrelloIntegrationAdapter } from './adapters/trello-integration-adapter'
import { IntegrationsController } from './controller/integrations.controller'
import { IntegrationAdapterRegistry } from './registry/integration-adapter.registry'
import { IntegrationConnectionService } from './service/integration-connection.service'

@Module({
  controllers: [IntegrationsController],
  exports: [IntegrationConnectionService],
  imports: [
    AuthModule,
    DatabaseModule,
    StorageModule,
    UsersModule,
  ],
  providers: [
    TrelloIntegrationAdapter,
    {
      inject: [TrelloIntegrationAdapter],
      provide: IntegrationAdapterRegistry,
      useFactory: (trelloAdapter: TrelloIntegrationAdapter) =>
        new IntegrationAdapterRegistry([trelloAdapter]),
    },
    IntegrationConnectionService,
  ],
})
export class IntegrationsModule { }
