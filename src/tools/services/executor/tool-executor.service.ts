// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { ToolRegistryService } from '../registry/tool-registry.service';
import { ToolRepository } from 'src/tools/repositories/tool.repository';
import { ToolNotFoundError } from '../error/tool.error';

@Injectable()
export class ToolExecutorService {

    // MARK: - Constructor

    /**
     * Creates a new {@link ToolExecutorService}.
     * @param toolRegistryService - The tool registry service.
     * @param toolRepository - The tool repository.
     */
    constructor(
        private readonly toolRegistryService: ToolRegistryService,
        private readonly toolRepository: ToolRepository,
    ) { }

    // MARK: - Instance methods

    /**
     * Executes a tool by slug.
     * @param slug - The slug of the tool to execute.
     * @returns The result of the tool execution.
     */
    async execute(slug: string): Promise<string> {
        const tool = await this.toolRepository.findBySlug(slug.trim());

        if (!tool) throw new ToolNotFoundError();

        const runtimeTool = this.toolRegistryService.getBySlug(tool.slug.trim());

        return await runtimeTool.execute();
    }
}
