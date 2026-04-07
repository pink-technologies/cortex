// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { Tool } from '../../tool';
import {
    ToolAlreadyRegisteredError,
    ToolNotFoundError,
    ToolRequiredIdError,
} from '../error/tool.error';

/**
 * In-memory registry for tool implementations. Tools register at boot and are read by id.
 *
 * Ids are normalized (trimmed) for storage and lookup.
 *
 * @example
 * ```ts
 * registry.register(myTool);
 * const tool = registry.findById('my-tool');
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
        if (this.tools.has(tool.id.trim())) throw new ToolAlreadyRegisteredError();

        this.tools.set(tool.id.trim(), tool);
    }

    /**
     * Finds a tool by slug. Slug is trimmed before lookup.
     * @param slug - The slug of the tool.
     * @returns The registered tool.
     * @throws {@link ToolRequiredSlugError} When slug is empty or whitespace.
     * @throws {@link ToolNotFoundError} When no tool is registered for the slug.
     */
    findById(id: string): Tool {
        if (!id.trim()) throw new ToolRequiredIdError();

        const tool = this.tools.get(id.trim());

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

    /**
     * Stable snapshot for tool recommendations: no executable surface, only metadata.
     */
    listCatalogEntries(): Array<{ id: string; name: string; description: string }> {
        return this.retrieve().map((tool) => ({
            id: tool.id,
            name: tool.name,
            description: tool.description,
        }));
    }
}
