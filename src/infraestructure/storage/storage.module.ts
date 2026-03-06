// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisStorageService } from './redis/redis-storage.service';
import { STORAGE } from './storage.tokens';

@Global()
@Module({
    imports: [ConfigModule],
    exports: [STORAGE],
    providers: [
        {
            provide: STORAGE,
            inject: [ConfigService],
            useFactory: async (config: ConfigService) =>
                await RedisStorageService.make(
                    config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
                ),
        },
    ],
})
export class StorageModule { }
