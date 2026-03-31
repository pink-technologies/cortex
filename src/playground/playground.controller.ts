// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import { Kernel } from '@/kernel/kernel';
import { OriginType } from '@/shared/types/input/execution-input';
import { PlaygroundMessageDto } from './dto/playground-message.dto';

@Controller('v1/playground')
export class PlaygroundController {
    constructor(private readonly kernel: Kernel) { }

    /**
     * Runs one message through the kernel (default entry agent → LLM → decision executor).
     */
    @Post()
    @HttpCode(200)
    async run(@Body() body: PlaygroundMessageDto) {
        return this.kernel.process({
            message: body.message,
            origin: OriginType.CHAT,
        });
    }
}
