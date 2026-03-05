// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisStorageService } from './redis/redis-storage.service';

@Global()
@Module({
    imports: [ConfigModule],
    exports: [RedisStorageService],
    providers: [
        {
            provide: RedisStorageService,
            inject: [ConfigService],
            useFactory: async (config: ConfigService) =>
                await RedisStorageService.make(
                    config.get<string>('REDISCLOUD_URL') ?? 'localhost',
                ),
        },
    ],
})
export class StorageModule { }
