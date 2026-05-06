// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { AuthenticatorGuard } from '@/gateway/authentication/guards/authenticator-guard'
import { OrganizationMembershipsRepository } from '@/gateway/organizations/repositories/memberships/organization-memberships.repository'
import { UsersModule } from '@/gateway/users/users.module'
import { AuthModule } from '@/infraestructure/auth/auth.module'
import { DatabaseModule } from '@/infraestructure/database'
import { SecretManagerModule } from '@/infraestructure/secret/secret-manager.module'
import { TrelloIntegrationAdapter } from './adapters/trello-integration-adapter'
import { IntegrationsController } from './controller/integrations.controller'
import { IntegrationRepository } from './domain/repository/integration/integration.repository'
import { OrganizationIntegrationRepository } from './domain/repository/organization-integration/organization-integration.repository'
import { IntegrationAdapterRegistry } from './registry/integration-adapter.registry'
import { IntegrationConnectionService } from './service/integration-connection.service'

@Module({
  controllers: [IntegrationsController],
  exports: [IntegrationConnectionService],
  imports: [
    AuthModule,
    DatabaseModule,
    SecretManagerModule,
    UsersModule,
  ],
  providers: [
    AuthenticatorGuard,
    IntegrationRepository,
    OrganizationIntegrationRepository,
    OrganizationMembershipsRepository,
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
