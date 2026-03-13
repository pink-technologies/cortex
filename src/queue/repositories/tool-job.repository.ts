// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { ToolJob, ToolJobStatus } from '@prisma/client';
import {
    Database
} from 'src/infraestructure/database';

/**
 * Repository responsible for querying and updating {@link ToolJob} entities (log/audit of tool executions).
 */
@Injectable()
export class ToolJobRepository {
    // MARK: - Constructor

    /**
     * Creates a new {@link ToolJobRepository}.
     *
     * @param database - The database client used to perform tool operations.
     * Injected at runtime to support inversion of control and enable testability.
     */
    constructor(private readonly database: Database) { }

    // MARK: - Instance methods

    /**
     * Upserts a tool job in status QUEUED.
     *
     * @param toolId - The ID of the tool.
     * @returns The {@link ToolJob} entity.
     */
    async upsertQueued(toolId: string): Promise<ToolJob> {
        return this.database.toolJob.upsert({
            where: { toolId },
            create: { toolId, status: ToolJobStatus.QUEUED },
            update: { status: ToolJobStatus.QUEUED },
        });
    }

    /**
     * Finds a tool job by its tool ID.
     *
     * @param toolId - The ID of the tool.
     * @returns The {@link ToolJob} entity if found, or null otherwise.
     */
    async findByToolId(toolId: string): Promise<ToolJob | null> {
        return this.database.toolJob.findUnique({
            where: { toolId },
        });
    }
}
