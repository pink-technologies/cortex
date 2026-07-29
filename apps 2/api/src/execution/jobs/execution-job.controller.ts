// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ExecutionJobExceptionFilter } from './filter/exception.filter'
import { ExecutionJobService } from './execution-job.service'
import { ExecutionJobResponseMapper } from './mapper/execution-job-response-mapper'
import { ZodValidationPipe } from '@/http/pipes/zod-validation.pipe'
import {
  type ClaimExecutionJobRequest,
  type ClaimExecutionJobResponse,
  ClaimExecutionJobRequestSchema,
  ClaimExecutionJobResponseSchema,
} from '@cortex/protocol'

import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseFilters,
} from '@nestjs/common'

/**
 * HTTP transport for execution-job operations.
 *
 * Accepts execution-job HTTP requests and delegates claim and state-transition
 * operations to {@link ExecutionJobService}. The controller contains no
 * persistence or scheduling logic.
 *
 * Exposes:
 * - `POST /execution-jobs/claim` — atomically claim the next compatible,
 *   available job for a worker,
 * - `POST /execution-jobs/:id/complete` — transition a running job to
 *   `COMPLETED`,
 * - `POST /execution-jobs/:id/fail` — transition a running job to `FAILED`.
 *
 * Invalid state transitions return HTTP 409. Unexpected execution-job domain
 * failures are converted to sanitized HTTP 503 responses by
 * {@link ExecutionJobExceptionFilter}.
 */
@Controller('execution-jobs')
@UseFilters(ExecutionJobExceptionFilter)
export class ExecutionJobController {
  // MARK: - Constructor

  /**
   * Creates the execution-job HTTP controller.
   *
   * @param executionJobService - Application service that performs claims and
   *   guarded job-state transitions.
   */
  constructor(private readonly executionJobService: ExecutionJobService) {}

  // MARK: - Instance methods

  /**
   * Claims the next available job compatible with the requesting node.
   *
   * The validated request describes the node's supported job kinds,
   * capabilities, labels, identity, and requested lease duration.
   * 
   * @param body - The request body containing the node's capabilities, labels, lease duration, supported kinds, and node ID.
   * @returns The claimed execution job or null if no job is available.
   * @throws ZodValidationException If the request body is invalid.
   * @throws ExecutionJobClaimError If the job claim fails.
   */
  @Post('claim')
  @HttpCode(HttpStatus.OK)
  async claimNextAvailable(
    @Body(new ZodValidationPipe(ClaimExecutionJobRequestSchema))
    body: ClaimExecutionJobRequest,
  ): Promise<ClaimExecutionJobResponse | null> {
    const parameters = {
      capabilities: body.capabilities,
      labels: body.labels,
      leaseDurationSeconds: body.leaseDurationSeconds,
      supportedKinds: body.supportedKinds,
      nodeId: body.nodeId,
    }

    const executionJob = await this.executionJobService.claimNextAvailable(
        parameters
      )

    if (!executionJob) {
      return null
    }

    return ClaimExecutionJobResponseSchema.parse({
      job: ExecutionJobResponseMapper.from(executionJob),
    })
  }

  /**
   * Marks a running execution job as completed.
   *
   * The service performs a guarded `RUNNING` → `COMPLETED` transition. The
   * endpoint returns HTTP 204 with an empty body when the transition succeeds.
   *
   * @param id - Primary key of the execution job to complete.
   * @throws ConflictException When the job does not exist or is not currently
   *   `RUNNING`.
   * @throws ExecutionJobCompleteError When the persistence operation fails.
   */
  @Post(':id/complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async complete(@Param('id') id: string): Promise<void> {
    const completed = await this.executionJobService.complete(id)

    if (!completed) {
      throw new ConflictException(
        'Execution job cannot be completed from its current state',
      )
    }
  }

  /**
   * Marks a running execution job as failed.
   *
   * The service performs a guarded `RUNNING` → `FAILED` transition. The
   * endpoint returns HTTP 204 with an empty body when the transition succeeds.
   *
   * @param id - Primary key of the execution job to fail.
   * @throws ConflictException When the job does not exist or is not currently
   *   `RUNNING`.
   * @throws ExecutionJobFailError When the persistence operation fails.
   */
  @Post(':id/fail')
  @HttpCode(HttpStatus.NO_CONTENT)
  async fail(@Param('id') id: string): Promise<void> {
    const failed = await this.executionJobService.fail(id)

    if (!failed) {
      throw new ConflictException(
        'Execution job cannot be failed from its current state',
      )
    }
  }
}
