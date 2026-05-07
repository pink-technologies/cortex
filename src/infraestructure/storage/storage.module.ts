// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { AwsSecretStorageService } from './secret/aws-secret-storage.service';
import { RedisStorageService } from './redis/redis-storage.service';
import { STORAGE } from './storage';

@Global()
@Module({
    imports: [ConfigModule],
    exports: [STORAGE, AwsSecretStorageService],
    providers: [
        {
            provide: STORAGE,
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => {
                await RedisStorageService.make(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379');
            }
        },
        {
            inject: [ConfigService],
            provide: SecretsManagerClient,
            useFactory: (config: ConfigService) =>
                new SecretsManagerClient({
                    region: config.get<string>('AWS_REGION'),
                }),
        },
        AwsSecretStorageService,
    ],
})
export class StorageModule { }
