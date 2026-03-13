// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from 'src/infraestructure/database';
import { ToolsModule } from 'src/tools/tools.module';
import { TOOL_EXECUTION_QUEUE_NAME } from './constants';
import { QueueService } from './services/queue.service';

@Module({
    imports: [
        ConfigModule,
        DatabaseModule,
        ToolsModule,
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: {
                    host: config.get('REDIS_HOST', 'localhost'),
                    port: config.get('REDIS_PORT', 6379),
                },
            }),
        }),
        BullModule.registerQueue({
            name: TOOL_EXECUTION_QUEUE_NAME,
        }),
    ],
    exports: [QueueService],
    providers: [QueueService],
})
export class QueueModule {}