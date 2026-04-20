// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@/infraestructure/database/index';
import { ToolsModule } from '@/tools/tools.module';
import { CapabilityService } from './service/capability.service';
import { CapabilityBootstrapService } from './service/capability-bootstrap.service';
import { TRELLO_CREDENTIALS_TOKEN, TrelloCapabilityService } from './service/trello/ trello-capability.service';
import { CapabilityRegistryService } from './service/registry/ capability-registry.service';
import { BUNDLED_CAPABILITIES_ROOT } from './capability.tokens';
import { DECODER, TomlDecoder } from '@/shared/types';

const TRELLO_API_KEY_ENV = 'TRELLO_API_KEY';
const TRELLO_TOKEN_ENV = 'TRELLO_TOKEN';

@Module({
    controllers: [],
    imports: [ConfigModule, DatabaseModule, ToolsModule],
    exports: [CapabilityService, TrelloCapabilityService, CapabilityRegistryService],
    providers: [
        {
            provide: BUNDLED_CAPABILITIES_ROOT,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const raw = config.get<string>('CAPABILITIES_BUNDLED_ROOT')?.trim();
                const hasExistingPath = raw && raw.length > 0;
                const root = hasExistingPath ? raw : path.join('src', 'capabilities', 'bundled');
                return path.isAbsolute(root) ? root : path.join(process.cwd(), root);
            },
        },
        CapabilityRegistryService,
        CapabilityBootstrapService,
        { provide: DECODER, useClass: TomlDecoder },
        CapabilityService,
        {
            provide: TRELLO_CREDENTIALS_TOKEN,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                apiKey: config.get<string>(TRELLO_API_KEY_ENV)?.trim() ?? '',
                token: config.get<string>(TRELLO_TOKEN_ENV)?.trim() ?? '',
            }),
        },
        TrelloCapabilityService,
    ],
})
export class CapabilitiesModule { }