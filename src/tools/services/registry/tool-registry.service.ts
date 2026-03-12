// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/interface/tool';
import {
    ToolAlreadyRegisteredError,
    ToolNotFoundError,
    ToolRequiredNameError,
    ToolRequiredSlugError,
    ToolRequiredError,
} from '../error/tool.error';

@Injectable()
export class ToolRegistryService {
    // MARK: - Properties

    /**
     * The tools registry.
     */
    private readonly tools: Map<string, Tool> = new Map();

    // MARK: - Instance methods

    /**
     * Registers a tool.
     * @param tool - The tool to register.
     * @throws When the tool registration fails.
     */
    register(tool: Tool): void {
        if (!tool) throw new ToolRequiredError();

        if (!tool.slug.trim()) throw new ToolRequiredSlugError();

        if (!tool.name.trim()) throw new ToolRequiredNameError();

        if (this.tools.has(tool.slug.trim())) throw new ToolAlreadyRegisteredError();

        this.tools.set(tool.slug.trim(), tool);
    }

    /**
     * Finds a tool by slug.
     * @param slug - The slug of the tool.
     * @returns The tool.
     */
    getBySlug(slug: string): Tool {
        if (!slug.trim()) throw new ToolRequiredSlugError();

        const tool = this.tools.get(slug.trim());

        if (!tool) throw new ToolNotFoundError();

        return tool;
    }

    /**
     * Retrieves the list of tools.
     * 
     * @returns The list of tools.
     */
    list(): Tool[] {
        if (this.tools.size === 0) return [];

        return Array.from(this.tools.values());
    }
}