// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InMemoryStorageService } from './service/in-memory/in-memory.service';
import { RedisStorageService } from './service/redis/redis-storage.service';
import { REDIS_STORAGE, STORAGE } from './storage.tokens';

@Global()
@Module({
    imports: [ConfigModule],
    exports: [STORAGE, REDIS_STORAGE],
    providers: [
        {
            provide: STORAGE,
            useFactory: () => new InMemoryStorageService(new Map()),
        },
        {
            provide: REDIS_STORAGE,
            inject: [ConfigService],
            useFactory: async (config: ConfigService) =>
                await RedisStorageService.make(
                    config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
                ),
        },
    ],
})
export class StorageModule { }
