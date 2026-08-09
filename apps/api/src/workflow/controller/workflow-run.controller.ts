// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ZodValidationPipe } from '@/http/pipes/zod-validation.pipe'
import { WorkflowExceptionFilter } from '../filter/exception.filter'
import { WorkflowOperatorGuard } from '../guard'
import { WorkflowRunListResponseMapper, WorkflowRunResponseMapper } from '../mapper'
import { WorkflowOrchestrator } from '../orchestrator'
import { WORKFLOW_RUN_REPOSITORY, type WorkflowRunRepository } from '../repository'
import {
  DecideWorkflowRunApprovalRequestSchema,
  ListWorkflowRunsQuerySchema,
  type DecideWorkflowRunApprovalRequest,
  type ListWorkflowRunsQuery,
  type WorkflowRunListResponse,
  type WorkflowRunResponse,
} from '@cortex/protocol'

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common'

/**
 * HTTP transport for public workflow-run operations.
 *
 * Exposes:
 * - `GET /workflow-runs` — list runs with status/definition filters and paging.
 * - `GET /workflow-runs/:id` — retrieve a run's status and step progress.
 * - `POST /workflow-runs/:id/approve` — approve a named approval step.
 * - `POST /workflow-runs/:id/cancel` — cancel an in-flight run.
 * - `POST /workflow-runs/:id/reject` — reject a named approval step.
 *
 * Mutating endpoints require the operator bearer token enforced by
 * {@link WorkflowOperatorGuard}; reads are open. Approval bodies must include
 * the `stepId` being decided so delayed retries cannot target a later gate.
 * Cancellation applies only while the run is non-terminal; otherwise the
 * request fails with HTTP 409.
 *
 * Unexpected workflow domain failures are converted to sanitized HTTP
 * responses by {@link WorkflowExceptionFilter}.
 */
@Controller('workflow-runs')
@UseFilters(WorkflowExceptionFilter)
export class WorkflowRunController {
  // MARK: - Constructor

  /**
   * Creates the public workflow-run HTTP controller.
   *
   * @param orchestrator - Orchestrator used to apply approval decisions and
   * cancellations.
   * @param workflowRunRepository - Persistence port used to read runs.
   */
  constructor(
    private readonly orchestrator: WorkflowOrchestrator,
    @Inject(WORKFLOW_RUN_REPOSITORY)
    private readonly workflowRunRepository: WorkflowRunRepository,
  ) {}

  // MARK: - Instance methods

  /**
   * Applies a positive approval decision to a named approval step.
   *
   * Completes the named step when it is still awaiting approval and resumes
   * the run. Retries that name an already-completed approval step are
   * idempotent.
   *
   * @param id - Primary key of the workflow run.
   * @param body - Decision body naming the approval step.
   * @returns The refreshed run after the decision.
   * @throws NotFoundException When no run exists for the identifier.
   * @throws WorkflowApprovalError When the step cannot accept approve (HTTP 409).
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(WorkflowOperatorGuard)
  async approve(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(DecideWorkflowRunApprovalRequestSchema))
    body: DecideWorkflowRunApprovalRequest,
  ): Promise<WorkflowRunResponse> {
    const run = await this.orchestrator.approve({
      actorId: body.actorId,
      decisionId: body.decisionId,
      reason: body.reason,
      runId: id,
      stepId: body.stepId,
    })

    if (!run) {
      throw new NotFoundException(`Workflow run '${id}' was not found`)
    }

    return WorkflowRunResponseMapper.from(run)
  }

  /**
   * Cancels an in-flight workflow run.
   *
   * Moves the run and its non-terminal steps to `CANCELLED`, cancels queued
   * child jobs, and requests cancellation of running child jobs.
   *
   * @param id - Primary key of the workflow run.
   * @returns The refreshed run after cancellation.
   * @throws NotFoundException When no run exists for the identifier.
   * @throws WorkflowCancelError When the run is already terminal (HTTP 409).
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(WorkflowOperatorGuard)
  async cancel(@Param('id') id: string): Promise<WorkflowRunResponse> {
    const run = await this.orchestrator.cancel(id)

    if (!run) {
      throw new NotFoundException(`Workflow run '${id}' was not found`)
    }

    return WorkflowRunResponseMapper.from(run)
  }

  /**
   * Retrieves a workflow run by its stable identifier.
   *
   * Returns the current lifecycle status, timestamps, persisted outcome, and
   * ordered step progress.
   *
   * @param id - Primary key of the workflow run.
   * @returns The workflow-run read response.
   * @throws NotFoundException When no run exists for the identifier.
   * @throws WorkflowRunReadError When persistence access fails.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string): Promise<WorkflowRunResponse> {
    const run = await this.workflowRunRepository.findById(id)

    if (!run) {
      throw new NotFoundException(`Workflow run '${id}' was not found`)
    }

    return WorkflowRunResponseMapper.from(run)
  }

  /**
   * Lists workflow runs, newest first.
   *
   * Supports optional `status` and `definitionKey` filters plus 1-based
   * paging; the response reports the total match count so clients can compute
   * page boundaries.
   *
   * @param query - Validated filters and paging values.
   * @returns One page of matching runs with paging metadata.
   * @throws WorkflowRunReadError When persistence access fails.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async list(
    @Query(new ZodValidationPipe(ListWorkflowRunsQuerySchema))
    query: ListWorkflowRunsQuery,
  ): Promise<WorkflowRunListResponse> {
    const page = await this.workflowRunRepository.findMany({
      definitionKey: query.definitionKey,
      limit: query.limit,
      page: query.page,
      status: query.status,
    })

    return WorkflowRunListResponseMapper.from(page, query.limit, query.page)
  }

  /**
   * Applies a negative approval decision to a named approval step.
   *
   * Fails the named step and the run when the step is still awaiting
   * approval. Retries that name an already-failed approval step are
   * idempotent.
   *
   * @param id - Primary key of the workflow run.
   * @param body - Decision body naming the approval step.
   * @returns The refreshed run after the decision.
   * @throws NotFoundException When no run exists for the identifier.
   * @throws WorkflowApprovalError When the step cannot accept reject (HTTP 409).
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(WorkflowOperatorGuard)
  async reject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(DecideWorkflowRunApprovalRequestSchema))
    body: DecideWorkflowRunApprovalRequest,
  ): Promise<WorkflowRunResponse> {
    const run = await this.orchestrator.reject({
      actorId: body.actorId,
      decisionId: body.decisionId,
      reason: body.reason,
      runId: id,
      stepId: body.stepId,
    })

    if (!run) {
      throw new NotFoundException(`Workflow run '${id}' was not found`)
    }

    return WorkflowRunResponseMapper.from(run)
  }
}
