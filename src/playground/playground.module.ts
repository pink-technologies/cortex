// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';

import { KernelModule } from '@/kernel/kernel.module';

import { PlaygroundController } from './playground.controller';

@Module({
    imports: [KernelModule],
    controllers: [PlaygroundController],
})
export class PlaygroundModule { }
