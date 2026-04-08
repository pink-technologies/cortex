// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@/infraestructure/database/index';
import { ToolsModule } from '@/tools/tools.module';
import { InMemoryStorageService } from '@/infraestructure/storage/service/in-memory/in-memory.service';
import { STORAGE } from '@/infraestructure/storage/storage.tokens';
import { TomlParser } from '@/shared/types';
import { CAPABILITIES_BUNDLED_ROOT } from './capability.tokens';
import { CapabilityService } from './service/capability.service';
import { TrelloCapabilityService } from './service/trello/trello-capability.service';

@Module({
    controllers: [],
    imports: [ConfigModule, DatabaseModule, ToolsModule],
    exports: [CapabilityService, TrelloCapabilityService],
    providers: [
        {
            provide: CAPABILITIES_BUNDLED_ROOT,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const raw = config.get<string>('CAPABILITIES_BUNDLED_ROOT')?.trim();
                const hasExistingPath = raw && raw.length > 0
                const root = hasExistingPath ? raw : path.join('src', 'capabilities', 'bundled');
                return path.isAbsolute(root) ? root : path.join(process.cwd(), root);
            },
        },
        TomlParser,
        CapabilityService,
        TrelloCapabilityService,
    ],
})
export class CapabilitiesModule { }
