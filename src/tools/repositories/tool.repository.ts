// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { Tool } from '@prisma/client';
import {
    Database
} from 'src/infraestructure/database';

/**
 * Repository responsible for querying {@link Tool} entities.
 */
@Injectable()
export class ToolRepository {
    // MARK: - Constructor

    /**
     * Creates a new {@link ToolRepository}.
     *
     * @param database - The database client used to perform tool operations.
     * Injected at runtime to support inversion of control and enable testability.
     */
    constructor(private readonly database: Database) { }

    // MARK: - Instance methods

    /**
     * Finds a tool by its slug.
     *
     * @param slug - The slug of the tool.
     * @returns The {@link Tool} entity if found, or null otherwise.
     *
     */
    async findBySlug(slug: string): Promise<Tool | null> {
        return this.database.tool.findUnique({
            where: { slug: slug.trim() },
        });
    }

    /**
     * Retrieves all tools.
     *
     * @returns The list of {@link Tool} entities.
     */
    async retrieve(): Promise<Tool[]> {
        return this.database.tool.findMany({
            orderBy: { name: 'asc' },
        });
    }
}
