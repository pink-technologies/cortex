// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CubeSemanticLayerApiClient } from './cube/cube-api.client';
import { CubeSemanticModelService } from './service/cube-semantic-model.service';
import {
    CUBE_META_TTL_MS,
} from './cube/cube-semantic-model.constants';

@Module({
    providers: [
        {
            provide: CubeSemanticLayerApiClient,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const apiUrl = config.get<string>('CUBEJS_API_URL')?.trim() ?? '';
                const apiToken = config.get<string>('CUBEJS_API_TOKEN')?.trim() ?? '';
                return new CubeSemanticLayerApiClient(apiUrl, apiToken);
            },
        },
        {
            provide: CUBE_META_TTL_MS,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const raw = config.get<string>('CUBE_META_TTL_MS')?.trim();
                const parsed = raw !== undefined && raw.length > 0 ? Number(raw) : Number.NaN;
                return Number.isFinite(parsed) && parsed >= 0
                    ? parsed
                    : 0;
            },
        },
        CubeSemanticModelService,
    ],
    exports: [CubeSemanticLayerApiClient, CubeSemanticModelService],
})
export class SemanticLayerModule { }
