// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Authenticatable } from './authenticatable';
import { CognitoAuthenticatable } from './cognito/cognito-authenticatable';

@Module({
  exports: [Authenticatable],
  providers: [
    {
      inject: [ConfigService],
      provide: Authenticatable,
      useFactory: (config: ConfigService) => {
        return new CognitoAuthenticatable({
          clientId: config.getOrThrow('COGNITO_CLIENT_ID'),
          clientPoolId: config.getOrThrow('COGNITO_USER_POOL_ID'),
          clientSecret: config.getOrThrow('COGNITO_CLIENT_SECRET'),
          region: config.getOrThrow('COGNITO_REGION'),
        });
      },
    },
  ],
})
export class AuthModule { }
