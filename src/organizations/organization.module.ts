// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infraestructure/database';
import { OrganizationRolesService } from './services/roles/organization.roles.service';
import { OrganizationsService } from './services/organizations/organizations.service';
import {
  OrganizationMembershipsRepository,
  OrganizationRolesRepository,
  OrganizationsRepository
} from './repositories';
import { OrganizationRoleController } from './controller/organization-role/organization.role.controller';

@Module({
  controllers: [OrganizationRoleController],
  imports: [DatabaseModule],
  exports: [
    OrganizationsService,
    OrganizationsRepository,
  ],
  providers: [
    OrganizationMembershipsRepository,
    OrganizationsRepository,
    OrganizationRolesRepository,
    OrganizationRolesService,
    OrganizationsService,
  ],
})
export class OrganizationsModule { }
