// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ToolServiceExceptionFilter } from '../filter/exception.filter';
import { ToolExecutorService } from '../services/executor/tool-executor.service';
import {
    Body,
    Controller,    
    HttpCode,    
    Post,
    UseFilters,
} from '@nestjs/common';

/**
 * HTTP controller responsible for handling tool execution.
 *
 * This controller acts as the transport-layer entry point for tool execution.
 * operations and delegates all business logic to the {@link ToolExecutorService}.
 */
@Controller('tools')
@UseFilters(ToolServiceExceptionFilter)
export class ToolExecutorController {
    // MARK: - Constructor

    /**
     * Creates a new {@link ToolExecutorController}.
     *
     * @param toolExecutorService - Application service responsible for
     * orchestrating tool execution.
     */
    constructor(private readonly toolExecutorService: ToolExecutorService) { }

    // MARK: - Instance methods

    /**
     * Executes a tool by slug.
     * @param slug - The slug of the tool to execute.
     * @returns The result of the tool execution.
     */
    @HttpCode(201)
    @Post('execute/:slug')
    async execute(@Body('slug') slug: string): Promise<string> {
        return this.toolExecutorService.execute(slug);
    }
}
