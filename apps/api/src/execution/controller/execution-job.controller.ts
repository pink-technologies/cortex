// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ZodValidationPipe } from '@/http/pipes/zod-validation.pipe'
import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, UseFilters } from '@nestjs/common'
import { ExecutionJobService } from '../execution-job.service'
import { ExecutionJobExceptionFilter } from '../filter/exception.filter'
import { ExecutionJobProtocolMapper, ExecutionJobResponseMapper } from '../mapper'
import {
  AgentExecuteJobKind,
  CreateAgentExecuteJobRequestSchema,
  CreateJiraTriageJobRequestSchema,
  CreateRepositoryReviewJobRequestSchema,
  JiraTriageJobKind,
  RepositoryReviewJobKind,
  type CreateAgentExecuteJobRequest,
  type CreateJiraTriageJobRequest,
  type CreateRepositoryReviewJobRequest,
  type ExecutionJob,
  type GetExecutionJobResponse,
} from '@cortex/protocol'

/**
 * HTTP transport for public execution-job operations.
 *
 * Accepts requests to enqueue agent executions, repository reviews, and Jira
 * triage jobs, and to retrieve their current lifecycle state and persisted
 * outcome.
 *
 * Exposes:
 * - `POST /execution-jobs/agent-executions` — enqueue an `agent.execute` job.
 * - `POST /execution-jobs/repository-reviews` — enqueue a `repository.review` job.
 * - `POST /execution-jobs/jira-triages` — enqueue a `jira.triage` job.
 * - `GET /execution-jobs/:id` — retrieve a job's status and persisted outcome.
 *
 * Node-facing claim and terminal-state operations are exposed separately by
 * `InternalExecutionJobController`.
 *
 * Unexpected execution-job domain failures are converted to sanitized HTTP
 * responses by {@link ExecutionJobExceptionFilter}.
 */
@Controller('execution-jobs')
@UseFilters(ExecutionJobExceptionFilter)
export class ExecutionJobController {
  // MARK: - Constructor

  /**
   * Creates the public execution-job HTTP controller.
   *
   * @param executionJobService - Application service used to create and
   * retrieve execution jobs.
   */
  constructor(private readonly executionJobService: ExecutionJobService) {}

  // MARK: - Instance methods

  /**
   * Enqueues an `agent.execute` execution job.
   *
   * Validates the request body with
   * {@link CreateAgentExecuteJobRequestSchema}, then persists a queued job with
   * kind {@link AgentExecuteJobKind}.
   *
   * The controller applies the initial payload version, empty policy defaults,
   * and an empty capability requirement set. Any Node advertising support for
   * `agent.execute` may claim the job.
   *
   * @param request - Validated request containing the agent payload and
   * optional queue priority.
   * @returns The persisted execution job mapped to its protocol representation.
   * @throws ZodValidationException If the request body is invalid.
   * @throws ExecutionJobCreateError If the execution job cannot be persisted.
   */
  @Post('agent-executions')
  @HttpCode(HttpStatus.CREATED)
  async createAgentExecution(
    @Body(new ZodValidationPipe(CreateAgentExecuteJobRequestSchema))
    request: CreateAgentExecuteJobRequest,
  ): Promise<ExecutionJob> {
    const executionJob = await this.executionJobService.create({
      kind: AgentExecuteJobKind,
      payload: request.payload,
      payloadVersion: 1,
      policy: {},
      priority: request.priority,
      requirements: {
        allOf: [],
      },
    })

    return ExecutionJobProtocolMapper.from(executionJob)
  }

  /**
   * Enqueues a `repository.review` execution job.
   *
   * Validates the request body with
   * {@link CreateRepositoryReviewJobRequestSchema}, then persists a queued job
   * with kind {@link RepositoryReviewJobKind}.
   *
   * @param request - Validated request containing the review payload and
   * optional queue priority.
   * @returns The persisted execution job mapped to its protocol representation.
   * @throws ZodValidationException If the request body is invalid.
   * @throws ExecutionJobCreateError If the execution job cannot be persisted.
   */
  @Post('repository-reviews')
  @HttpCode(HttpStatus.CREATED)
  async createRepositoryReview(
    @Body(new ZodValidationPipe(CreateRepositoryReviewJobRequestSchema))
    request: CreateRepositoryReviewJobRequest,
  ): Promise<ExecutionJob> {
    const executionJob = await this.executionJobService.create({
      kind: RepositoryReviewJobKind,
      payload: request.payload,
      payloadVersion: 1,
      policy: {},
      priority: request.priority,
      requirements: {
        allOf: [],
      },
    })

    return ExecutionJobProtocolMapper.from(executionJob)
  }

  /**
   * Enqueues a `jira.triage` execution job.
   *
   * Validates the request body with
   * {@link CreateJiraTriageJobRequestSchema}, then persists a queued job with
   * kind {@link JiraTriageJobKind}.
   *
   * @param request - Validated request containing the triage payload and
   * optional queue priority.
   * @returns The persisted execution job mapped to its protocol representation.
   */
  @Post('jira-triages')
  @HttpCode(HttpStatus.CREATED)
  async createJiraTriage(
    @Body(new ZodValidationPipe(CreateJiraTriageJobRequestSchema))
    request: CreateJiraTriageJobRequest,
  ): Promise<ExecutionJob> {
    const executionJob = await this.executionJobService.create({
      kind: JiraTriageJobKind,
      payload: request.payload,
      payloadVersion: 1,
      policy: {},
      priority: request.priority,
      requirements: {
        allOf: [],
      },
    })

    return ExecutionJobProtocolMapper.from(executionJob)
  }

  /**
   * Retrieves an execution job by its stable identifier.
   *
   * Returns the current lifecycle state and any persisted completion result or
   * failure information.
   *
   * @param id - Primary key of the execution job to retrieve.
   * @returns The execution-job read response.
   * @throws NotFoundException When no execution job exists for the identifier.
   * @throws ExecutionJobReadError When persistence access fails.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string): Promise<GetExecutionJobResponse> {
    const executionJob = await this.executionJobService.findById(id)

    if (!executionJob) {
      throw new NotFoundException(`Execution job '${id}' was not found`)
    }

    return ExecutionJobResponseMapper.from(executionJob)
  }
}
