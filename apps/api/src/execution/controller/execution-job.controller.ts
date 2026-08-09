// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ZodValidationPipe } from '@/http/pipes/zod-validation.pipe'
import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, UseFilters } from '@nestjs/common'
import { agentExecuteFlow, jiraTriageFlow, repositoryReviewFlow } from '@/workflow/definitions'
import { WorkflowExceptionFilter } from '@/workflow/filter/exception.filter'
import { WorkflowOrchestrator } from '@/workflow/orchestrator'
import { ExecutionJobService } from '../execution-job.service'
import { ExecutionJobExceptionFilter } from '../filter/exception.filter'
import { ExecutionJobProtocolMapper, ExecutionJobResponseMapper } from '../mapper'
import {
  CreateAgentExecuteJobRequestSchema,
  CreateJiraTriageJobRequestSchema,
  CreateRepositoryReviewJobRequestSchema,
  type CreateAgentExecuteJobRequest,
  type CreateJiraTriageJobRequest,
  type CreateRepositoryReviewJobRequest,
  type ExecutionJob,
  type ExecutionJobResponse,
} from '@cortex/protocol'
/**
 * HTTP transport for public execution-job operations.
 *
 * Accepts requests to enqueue agent executions, repository reviews, and Jira
 * triage jobs, and to retrieve their current lifecycle state and persisted
 * outcome. Each create starts a one-step workflow run and responds with the
 * run's first-step job; the owning run is reachable through the job's `runId`
 * at `GET /workflow-runs/:id`.
 *
 * Exposes:
 * - `POST /execution-jobs/agent-executions` — start an `agent.execute.flow` run.
 * - `POST /execution-jobs/repository-reviews` — start a `repository.review.flow` run.
 * - `POST /execution-jobs/jira-triages` — start a `jira.triage.flow` run.
 * - `GET /execution-jobs/:id` — retrieve a job's status and persisted outcome.
 *
 * Node-facing claim and terminal-state operations are exposed separately by
 * `InternalExecutionJobController`.
 *
 * Unexpected execution-job domain failures are converted to sanitized HTTP
 * responses by {@link ExecutionJobExceptionFilter}; workflow start failures by
 * {@link WorkflowExceptionFilter}.
 */
@Controller('execution-jobs')
@UseFilters(ExecutionJobExceptionFilter, WorkflowExceptionFilter)
export class ExecutionJobController {
  // MARK: - Constructor

  /**
   * Creates the public execution-job HTTP controller.
   *
   * @param executionJobService - Application service used to retrieve
   * execution jobs.
   * @param orchestrator - Orchestrator used to start one-step workflow runs
   * for each enqueue request.
   */
  constructor(
    private readonly executionJobService: ExecutionJobService,
    private readonly orchestrator: WorkflowOrchestrator,
  ) {}

  // MARK: - Instance methods

  /**
   * Starts an `agent.execute.flow` workflow run.
   *
   * Validates the request body with
   * {@link CreateAgentExecuteJobRequestSchema}, then starts a one-step run
   * whose first step enqueues an `agent.execute` job carrying the request
   * payload.
   *
   * @param request - Validated request containing the agent payload and
   * optional queue priority.
   * @returns The first-step execution job mapped to its protocol
   * representation, including the owning `runId`.
   * @throws ZodValidationException If the request body is invalid.
   * @throws WorkflowRunCreateError If the workflow run cannot be persisted.
   */
  @Post('agent-executions')
  @HttpCode(HttpStatus.CREATED)
  async createAgentExecution(
    @Body(new ZodValidationPipe(CreateAgentExecuteJobRequestSchema))
    request: CreateAgentExecuteJobRequest,
  ): Promise<ExecutionJob> {
    const { job } = await this.orchestrator.start({
      definitionKey: agentExecuteFlow.key,
      input: request.payload,
      priority: request.priority,
    })

    return ExecutionJobProtocolMapper.from(job)
  }

  /**
   * Starts a `repository.review.flow` workflow run.
   *
   * Validates the request body with
   * {@link CreateRepositoryReviewJobRequestSchema}, then starts a one-step run
   * whose first step enqueues a `repository.review` job carrying the request
   * payload.
   *
   * @param request - Validated request containing the review payload and
   * optional queue priority.
   * @returns The first-step execution job mapped to its protocol
   * representation, including the owning `runId`.
   * @throws ZodValidationException If the request body is invalid.
   * @throws WorkflowRunCreateError If the workflow run cannot be persisted.
   */
  @Post('repository-reviews')
  @HttpCode(HttpStatus.CREATED)
  async createRepositoryReview(
    @Body(new ZodValidationPipe(CreateRepositoryReviewJobRequestSchema))
    request: CreateRepositoryReviewJobRequest,
  ): Promise<ExecutionJob> {
    const { job } = await this.orchestrator.start({
      definitionKey: repositoryReviewFlow.key,
      input: request.payload,
      priority: request.priority,
    })

    return ExecutionJobProtocolMapper.from(job)
  }

  /**
   * Starts a `jira.triage.flow` workflow run.
   *
   * Validates the request body with
   * {@link CreateJiraTriageJobRequestSchema}, then starts a one-step run whose
   * first step enqueues a `jira.triage` job carrying the request payload.
   *
   * @param request - Validated request containing the triage payload and
   * optional queue priority.
   * @returns The first-step execution job mapped to its protocol
   * representation, including the owning `runId`.
   * @throws ZodValidationException If the request body is invalid.
   * @throws WorkflowRunCreateError If the workflow run cannot be persisted.
   */
  @Post('jira-triages')
  @HttpCode(HttpStatus.CREATED)
  async createJiraTriage(
    @Body(new ZodValidationPipe(CreateJiraTriageJobRequestSchema))
    request: CreateJiraTriageJobRequest,
  ): Promise<ExecutionJob> {
    const { job } = await this.orchestrator.start({
      definitionKey: jiraTriageFlow.key,
      input: request.payload,
      priority: request.priority,
    })

    return ExecutionJobProtocolMapper.from(job)
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
  async findById(@Param('id') id: string): Promise<ExecutionJobResponse> {
    const executionJob = await this.executionJobService.findById(id)

    if (!executionJob) {
      throw new NotFoundException(`Execution job '${id}' was not found`)
    }

    return ExecutionJobResponseMapper.from(executionJob)
  }
}
