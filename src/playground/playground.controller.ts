// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Body, Controller, HttpCode, Post, UseFilters } from '@nestjs/common';
import { Kernel } from '@/kernel/kernel';
import { OriginType } from '@/shared/types/input/execution-input';
import { PlaygroundMessageDto } from './dto/playground-message.dto';
import { PlaygroundExceptionFilter } from './filter/exception.filter';

/**
 * Controller for the playground API.
 */
@Controller('v1/playground')
@UseFilters(PlaygroundExceptionFilter)
export class PlaygroundController {

    // MARK: - Constructor

    /**
     * Creates a new {@link PlaygroundController}.
     *
     * @param kernel - The kernel instance.
     */
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
