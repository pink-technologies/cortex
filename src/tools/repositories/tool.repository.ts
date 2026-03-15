// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { Database, Tool } from '@/infraestructure/database';

/**
 * Persistence layer for tool metadata.
 *
 * Reads {@link Tool} entities from the database. Does not perform tool execution;
 * use {@link ToolExecutorService} to resolve and run a tool by slug. All access
 * to tool data goes through this repository so the rest of the tools module
 * stays independent of the database implementation.
 *
 * @example
 * ```ts
 * const tool = await toolRepository.findBySlug('hello-world-tool');
 * const all = await toolRepository.retrieve();
 * ```
 */
@Injectable()
export class ToolRepository {
    // MARK: - Constructor

    /**
     * Creates a new {@link ToolRepository}.
     * @param database - Database client used for tool queries. Injected for IoC and testability.
     */
    constructor(private readonly database: Database) { }

    // MARK: - Instance methods

    /**
     * Finds a single tool by slug. Slug is trimmed before querying.
     * @param slug - Unique slug of the tool (e.g. `hello-world-tool`).
     * @returns The persisted {@link Tool} if found, otherwise `null`.
     */
    async findBySlug(slug: string): Promise<Tool | null> {
        return this.database.tool.findUnique({
            where: { slug: slug.trim() },
        });
    }

    /**
     * Retrieves all tools ordered by name ascending.
     * @returns Array of all persisted {@link Tool} entities.
     */
    async retrieve(): Promise<Tool[]> {
        return this.database.tool.findMany({
            orderBy: { name: 'asc' },
        });
    }
}
