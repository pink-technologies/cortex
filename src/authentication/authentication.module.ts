// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AuthModule } from '@/infraestructure/auth/auth.module';
import { DatabaseModule } from '@/infraestructure/database';
import { Module } from '@nestjs/common';
import { I18nModule } from '@/i18n/i18n.module';
import { AuthenticationController } from './controller/authentication.controller';
import { AuthenticationService } from './services/authentication.service';
import { UsersModule } from '@/users/users.module';
import { OrganizationsModule } from '@/organizations/organization.module';

@Module({
  controllers: [AuthenticationController],
  imports: [AuthModule, DatabaseModule, I18nModule, UsersModule, OrganizationsModule],
  providers: [AuthenticationService],
})
export class AuthenticationModule { }
