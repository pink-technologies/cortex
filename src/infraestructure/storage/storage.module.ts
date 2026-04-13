// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisStorageService } from './service/redis/redis-storage.service';
import { STORAGE } from './storage.tokens';

@Global()
@Module({
    imports: [ConfigModule],
    exports: [STORAGE],
    providers: [
        {
            provide: STORAGE,
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => {
                const url = config.get<string>('REDIS_URL')?.trim() || 'redis://localhost:6379';
                return RedisStorageService.make(url);
            },
        },
    ],
})
export class StorageModule { }
