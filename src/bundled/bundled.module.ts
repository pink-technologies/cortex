// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { BUNDLED_LOADER, FsBundledLoader } from './loader/bundled-loader';
import { BUNDLE_REGISTRY, InMemoryBundleRegistry } from './registry/bundle-registry';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { Module } from '@nestjs/common';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: BUNDLED_LOADER,
            inject: [ConfigService],
            useFactory: (config: ConfigService) =>
                new FsBundledLoader(
                    config.get<string>('BUNDLED_ROOT') ??
                    join(process.cwd(), 'bundles'),
                ),
        },
        {
            provide: BUNDLE_REGISTRY,
            useClass: InMemoryBundleRegistry,
        },
    ],
    exports: [BUNDLED_LOADER, BUNDLE_REGISTRY],
})
export class BundledModule { }
