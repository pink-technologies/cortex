// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { ToolRepository } from 'src/tools/repositories/tool.repository';
import { ToolNotFoundError } from 'src/tools/services/error/tool.error';
import { ToolJobRepository } from '../repositories/tool-job.repository';
import {
    TOOL_EXECUTION_JOB_NAME,
    TOOL_EXECUTION_QUEUE_NAME
} from '../constants';


/**
 * Service responsible for queuing the execution of a tool.
 */
@Injectable()
export class QueueService {

    // MARK: - Constructor

    /**
     * Creates a new {@link QueueService}.
     * @param toolRepository - The tool repository.
     * @param toolJobRepository - The tool job repository.
     * @param queue - The queue.
     * Injected at runtime to support inversion of control and enable testability.
     */
    constructor(
        @InjectQueue(TOOL_EXECUTION_QUEUE_NAME) private readonly queue: Queue,
        private readonly toolRepository: ToolRepository,
        private readonly toolJobRepository: ToolJobRepository,
    ) { }

    /**
     * Enqueues the execution of a tool by slug and waits for the result.
     * @param slug - The slug of the tool to execute.
     * @returns The result of the tool execution.
     */
    async enqueueAndWait(slug: string): Promise<string> {
        const tool = await this.toolRepository.findBySlug(slug);

        if (!tool) throw new ToolNotFoundError();

        const toolJob = await this.toolJobRepository.upsertQueued(tool.id);

        const job = await this.queue.add(TOOL_EXECUTION_JOB_NAME, {
            slug: tool.slug.trim(),
            toolJobId: toolJob.id,
        });

        return job.returnvalue;
    }
}
