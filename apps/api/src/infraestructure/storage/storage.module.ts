// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Global, Module } from '@nestjs/common'
import { RedisStorageService } from './redis/redis-storage.service'
import { STORAGE } from './storage'
import { API_CONFIGURATION, type ApiConfiguration } from '@/configuration'

@Global()
@Module({
  exports: [STORAGE],
  providers: [
    {
      provide: STORAGE,
      inject: [API_CONFIGURATION],
      useFactory: async (configuration: ApiConfiguration) => {
        return await RedisStorageService.make(configuration.redisURL)
      },
    },
  ],
})
export class StorageModule {}
