// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { ToolRegistryService } from '../registry/tool-registry.service';
import { ToolRepository } from '@/tools/repositories/tool.repository';
import { ToolNotFoundError } from '../error/tool.error';

/**
 * Orchestrates tool execution by slug.
 *
 * Resolves the tool via the repository (persisted metadata), looks up the
 * runtime implementation from the registry, then runs it. Use this service
 * when you have a tool slug and want to execute the corresponding tool.
 *
 * @example
 * ```ts
 * const result = await toolExecutorService.execute('my-tool');
 * ```
 */
@Injectable()
export class ToolExecutorService {

    // MARK: - Constructor

    /**
     * Creates a new {@link ToolExecutorService}.
     * @param toolRegistryService - Registry of registered tool implementations.
     * @param toolRepository - Repository for tool metadata (e.g. slug lookup).
     */
    constructor(
        private readonly toolRegistryService: ToolRegistryService,
        private readonly toolRepository: ToolRepository,
    ) {}

    // MARK: - Instance methods

    /**
     * Executes the tool identified by the given slug.
     *
     * Looks up the tool in the repository, resolves its runtime from the registry,
     * and runs it. Slug is trimmed before lookup.
     *
     * @param slug - The slug of the tool to execute.
     * @returns The tool output as a string.
     * @throws {@link ToolNotFoundError} When no tool exists for the slug in the repository or registry.
     */
    async execute(slug: string): Promise<string> {
        const tool = await this.toolRepository.findBySlug(slug.trim());

        if (!tool) throw new ToolNotFoundError();

        const runtimeTool = this.toolRegistryService.findBySlug(tool.slug.trim());

        return await runtimeTool.execute('PinkTech');
    }
}
