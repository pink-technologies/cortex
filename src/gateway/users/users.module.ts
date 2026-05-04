// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { AuthenticatorGuard } from '@/gateway/authentication/guards/authenticator-guard';
import { AuthModule } from '@/infraestructure/auth/auth.module';
import { DatabaseModule } from '@/infraestructure/database';
import { UserRepository } from './repository/users.repository';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';

@Module({
  controllers: [UserController],
  imports: [
    AuthModule, 
    DatabaseModule,
  ],
  exports: [
    UserRepository, 
    UserService,
  ],
  providers: [
    AuthenticatorGuard, 
    UserRepository, 
    UserService,
  ],
})
export class UsersModule { }
