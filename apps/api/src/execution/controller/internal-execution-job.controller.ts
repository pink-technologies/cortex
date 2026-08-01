// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Body, ConflictException, Controller, HttpCode, HttpStatus, Param, Post, UseFilters } from '@nestjs/common'
import { ZodValidationPipe } from '@/http/pipes/zod-validation.pipe'
import { ExecutionJobExceptionFilter } from '../filter/exception.filter'
import { ExecutionJobService } from '../execution-job.service'
import { ExecutionJobProtocolMapper } from '../mapper/execution-job-protocol-mapper'
import {
    ClaimExecutionJobRequestSchema,
    ClaimExecutionJobResponseSchema,
    CompleteExecutionJobRequestSchema,
    FailExecutionJobRequestSchema,
    type ClaimExecutionJobRequest,
    type ClaimExecutionJobResponse,
    type CompleteExecutionJobRequest,
    type FailExecutionJobRequest,
} from '@cortex/protocol'

/**
 * Exposes Node-facing execution-job endpoints.
 *
 * Registered Cortex Nodes use this controller to claim compatible jobs and
 * report their terminal completion or failure state.
 *
 * Claim ownership is validated using the Node identifier and claim token
 * included in completion and failure requests.
 */
@Controller('internal/execution-jobs')
@UseFilters(ExecutionJobExceptionFilter)
export class InternalExecutionJobController {
  // MARK: - Constructor

  /**
   * Creates the internal execution-job controller.
   *
   * @param executionJobService - Service used to claim and transition execution
   * jobs.
   */
  constructor(private readonly executionJobService: ExecutionJobService) {}

  // MARK: - Instance Methods

  /**
   * Claims the next available execution job for a registered Node.
   *
   * The service resolves the persisted Node registration and uses its supported
   * job kinds, capabilities, and labels to find compatible work.
   *
   * @param request - Validated request containing the registered Node
   * identifier.
   * @returns The claimed execution job, or `null` when no compatible job is
   * available.
   */
  @Post('claim')
  @HttpCode(HttpStatus.OK)
  async claimNextAvailable(
    @Body(new ZodValidationPipe(ClaimExecutionJobRequestSchema))
    request: ClaimExecutionJobRequest,
  ): Promise<ClaimExecutionJobResponse> {
    const executionJob = await this.executionJobService.claimNextAvailable(request.nodeId)

    return ClaimExecutionJobResponseSchema.parse({
      job: executionJob ? ExecutionJobProtocolMapper.from(executionJob) : null,
    })
  }

  /**
   * Marks a claimed execution job as completed.
   *
   * The transition succeeds only when the job is currently running and the
   * request contains the Node identifier and claim token associated with the
   * active execution attempt.
   *
   * @param id - Identifier of the execution job to complete.
   * @param request - Validated completion request containing claim ownership
   * and the optional execution result.
   * @throws ConflictException When the request does not own the active claim or
   * the job cannot transition to `COMPLETED`.
   */
  @Post(':id/complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async complete(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CompleteExecutionJobRequestSchema))
    request: CompleteExecutionJobRequest,
  ): Promise<void> {
    const completed = await this.executionJobService.complete(id, request)

    if (!completed) {
      throw new ConflictException('Execution job cannot be completed by this Node or claim attempt')
    }
  }

  /**
   * Marks a claimed execution job as failed.
   *
   * The transition succeeds only when the job is currently running and the
   * request contains the Node identifier and claim token associated with the
   * active execution attempt.
   *
   * @param id - Identifier of the execution job to fail.
   * @param request - Validated failure request containing claim ownership and
   * the structured execution failure.
   * @throws ConflictException When the request does not own the active claim or
   * the job cannot transition to `FAILED`.
   */
  @Post(':id/fail')
  @HttpCode(HttpStatus.NO_CONTENT)
  async fail(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(FailExecutionJobRequestSchema))
    request: FailExecutionJobRequest,
  ): Promise<void> {
    const failed = await this.executionJobService.fail(id, request)

    if (!failed) {
      throw new ConflictException('Execution job cannot be failed by this Node or claim attempt')
    }
  }
}
