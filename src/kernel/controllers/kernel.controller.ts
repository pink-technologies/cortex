// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Body, Controller, Post, UseFilters } from '@nestjs/common';
import type { AgentHandleResult } from '../dto';
import { KernelExceptionFilter } from '../filter/kernel.exception-filter';
import { KernelService } from '../service/kernel.service';
import { ProcessKernelBodyDto } from '../dto/parameters/process-kernel-body.dto';

/**
 * HTTP controller for kernel process requests.
 *
 * Delegates to {@link KernelService} and returns the agent handle result.
 */
@Controller('/v1/kernel')
@UseFilters(KernelExceptionFilter)
export class KernelController {
    constructor(private readonly kernelService: KernelService) { }

    /**
     * Processes a kernel input.
     *
     * @param body - Validated request body (payload + context).
     * @returns The agent handle result (chat or webhook response).
     */
    @Post('process')
    async process(@Body() body: ProcessKernelBodyDto): Promise<AgentHandleResult> {
        const input = body.toKernelInput();
        return this.kernelService.process(input);
    }
}
