// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { AuthModule } from '@/infraestructure/auth/auth.module';
import { DatabaseModule } from '@/infraestructure/database';
import { I18nModule } from '@/i18n/i18n.module';
import { UserRepository } from './repository/users.repository';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';

@Module({
  controllers: [UserController],
  imports: [AuthModule, DatabaseModule, I18nModule],
  exports: [UserRepository, UserService],
  providers: [UserRepository, UserService],
})
export class UsersModule { }
