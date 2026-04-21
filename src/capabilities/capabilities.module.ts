// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@/infraestructure/database/index';
import { InMemoryStorageService } from '@/infraestructure/storage/in-memory/in-memory.service';
import { STORAGE } from '@/infraestructure/storage';
import { DECODER, TomlDecoder } from '@/shared/types';
import { BUNDLED_CAPABILITIES_PATH, BUNDLED_CAPABILITIES_PATH_KEY } from './capability-tokens';
import { CapabilityService } from './service/capability.service';
import { ToolsModule } from '@/tools/tools.module';
import { TrelloCapabilityService } from './service/trello/trello-capability.service';

@Module({
    controllers: [],
    imports: [ConfigModule, DatabaseModule, ToolsModule],
    exports: [CapabilityService, TrelloCapabilityService],
    providers: [
        { provide: DECODER, useClass: TomlDecoder },
        CapabilityService,
        TrelloCapabilityService,
        {
            provide: STORAGE,
            useFactory: () => new InMemoryStorageService(new Map()),
        },
        {
            provide: BUNDLED_CAPABILITIES_PATH,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const raw = config.get<string>(BUNDLED_CAPABILITIES_PATH_KEY)?.trim();
                const hasExistingPath = raw && raw.length > 0
                const root = hasExistingPath ? raw : path.join('src', 'capabilities', 'bundled');
                return path.isAbsolute(root) ? root : path.join(process.cwd(), root);
            },
        },
    ],
})
export class CapabilitiesModule {}
