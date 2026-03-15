// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/tools/tool';
import { 
    ToolAlreadyRegisteredError, 
    ToolNotFoundError, 
    ToolRequiredSlugError 
} from '../error/tool.error';

/**
 * Central registry for executable tools.
 *
 * Holds all tools by slug and provides lookup and listing. Tools must be registered
 * before they can be found or executed. Slugs are normalized (trimmed) for storage
 * and lookup.
 *
 * @example
 * ```ts
 * registry.register(myTool);
 * const tool = registry.findBySlug('my-tool');
 * const all = registry.retrieve();
 * ```
 */
@Injectable()
export class ToolRegistryService {
    // MARK: - Properties

    /**
     * The tools registry.
     */
    private readonly tools: Map<string, Tool> = new Map();

    // MARK: - Instance methods

    /**
     * Registers a tool by its slug. Slug is trimmed before storage.
     * @param tool - The tool to register.
     * @throws {@link ToolAlreadyRegisteredError} When a tool with the same slug is already registered.
     */
    register(tool: Tool): void {
        if (this.tools.has(tool.slug.trim())) throw new ToolAlreadyRegisteredError();

        this.tools.set(tool.slug.trim(), tool);
    }

    /**
     * Finds a tool by slug. Slug is trimmed before lookup.
     * @param slug - The slug of the tool.
     * @returns The registered tool.
     * @throws {@link ToolRequiredSlugError} When slug is empty or whitespace.
     * @throws {@link ToolNotFoundError} When no tool is registered for the slug.
     */
    findBySlug(slug: string): Tool {
        if (!slug.trim()) throw new ToolRequiredSlugError();

        const tool = this.tools.get(slug.trim());

        if (!tool) throw new ToolNotFoundError();

        return tool;
    }

    /**
     * Returns all registered tools in registration order (insertion order of the map).
     * @returns A new array of all registered tools.
     */
    retrieve(): Tool[] {
        return Array.from(this.tools.values());
    }
}
