// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { AuthModule } from '@/infraestructure/auth/auth.module';
import { DatabaseModule } from '@/infraestructure/database';
import { UsersModule } from '@/gateway/users/users.module';
import { OrganizationRolesService } from './services/roles/organization.roles.service';
import { OrganizationsService } from './services/organizations/organizations.service';
import { OrganizationRoleController } from './controller/organization-role/organization.role.controller';
import { AuthenticatorGuard } from '../authentication/guards/authenticator-guard';
import {
  OrganizationMembershipsRepository,
  OrganizationRolesRepository,
  OrganizationsRepository
} from './repositories';

@Module({
  controllers: [OrganizationRoleController],
  imports: [AuthModule, DatabaseModule, UsersModule],
  exports: [
    OrganizationsService,
    OrganizationsRepository,
  ],
  providers: [
    AuthenticatorGuard,
    OrganizationMembershipsRepository,
    OrganizationsRepository,
    OrganizationRolesRepository,
    OrganizationRolesService,
    OrganizationsService,
  ],
})
export class OrganizationsModule { }
