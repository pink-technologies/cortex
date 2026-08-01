// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Controller, Get, HttpCode, HttpStatus, Inject, NotFoundException, Param, Post, UseFilters } from '@nestjs/common'
import { WorkflowExceptionFilter } from '../filter/exception.filter'
import { WorkflowRunResponseMapper } from '../mapper'
import { WorkflowOrchestrator } from '../orchestrator'
import { WORKFLOW_RUN_REPOSITORY, type WorkflowRunRepository } from '../repository'
import type { WorkflowRunResponse } from '@cortex/protocol'

/**
 * HTTP transport for public workflow-run operations.
 *
 * Exposes:
 * - `GET /workflow-runs/:id` — retrieve a run's status and step progress.
 * - `POST /workflow-runs/:id/approve` — apply a positive approval decision.
 * - `POST /workflow-runs/:id/reject` — apply a negative approval decision.
 *
 * Approval decisions apply only while the run has a step in
 * `AWAITING_APPROVAL`; otherwise the request fails with HTTP 409.
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
   * @param orchestrator - Orchestrator used to apply approval decisions.
   * @param workflowRunRepository - Persistence port used to read runs.
   */
  constructor(
    private readonly orchestrator: WorkflowOrchestrator,
    @Inject(WORKFLOW_RUN_REPOSITORY)
    private readonly workflowRunRepository: WorkflowRunRepository,
  ) {}

  // MARK: - Instance methods

  /**
   * Applies a positive approval decision to a parked run.
   *
   * Completes the step awaiting approval and resumes the run: the next `JOB`
   * step is activated, or the run completes when no steps remain.
   *
   * @param id - Primary key of the workflow run.
   * @returns The refreshed run after the decision.
   * @throws NotFoundException When no run exists for the identifier.
   * @throws WorkflowApprovalError When no step is awaiting approval (HTTP 409).
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id') id: string): Promise<WorkflowRunResponse> {
    const run = await this.orchestrator.approve(id)

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
   * Applies a negative approval decision to a parked run.
   *
   * Fails the step awaiting approval and the run.
   *
   * @param id - Primary key of the workflow run.
   * @returns The refreshed run after the decision.
   * @throws NotFoundException When no run exists for the identifier.
   * @throws WorkflowApprovalError When no step is awaiting approval (HTTP 409).
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(@Param('id') id: string): Promise<WorkflowRunResponse> {
    const run = await this.orchestrator.reject(id)

    if (!run) {
      throw new NotFoundException(`Workflow run '${id}' was not found`)
    }

    return WorkflowRunResponseMapper.from(run)
  }
}
