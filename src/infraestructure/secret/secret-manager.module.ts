// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AwsSecretsManagerAdapter } from './manager/secret-manager-adapter'
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager'

@Module({
  exports: [AwsSecretsManagerAdapter],
  providers: [
    {
      inject: [ConfigService],
      provide: AwsSecretsManagerAdapter,
      useFactory: (config: ConfigService) => {
        return new AwsSecretsManagerAdapter(
          new SecretsManagerClient({
            region: config.getOrThrow('AWS_REGION'),
          }))
      },
    },
  ],
})
export class SecretManagerModule { }
