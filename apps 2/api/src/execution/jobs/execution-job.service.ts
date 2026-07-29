// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { ClaimExecutionJobParameters } from './parameters'
import { EXECUTION_JOB_REPOSITORY, type ExecutionJobRepository } from './execution-job-repository'
import { ExecutionJobClaimError, ExecutionJobCompleteError, ExecutionJobFailError } from './error/error'
import { ExecutionJob } from './models/execution-job'

/**
 * Coordinates access to persisted execution jobs.
 *
 * The service delegates job claiming to the configured
 * {@link ExecutionJobRepository}, keeping execution orchestration independent
 * of the underlying persistence implementation.
 */
@Injectable()
export class ExecutionJobService {
  // MARK: - Constructor

  /**
   * Creates an execution job service backed by the injected repository.
   *
   * @param executionJobRepository - Repository used to atomically claim
   * available execution jobs.
   */
  constructor(
    @Inject(EXECUTION_JOB_REPOSITORY)
    private readonly executionJobRepository: ExecutionJobRepository,    
  ) {}

  // MARK: - Instance methods

  /**
   * Claims the next available execution job for the given parameters.
   *
   * @param parameters - The parameters for claiming the next available execution job.
   * @returns The claimed execution job, or `null` if no execution job is available.
   * @throws ExecutionJobClaimError If initiating the claim operation fails.
   */
  async claimNextAvailable(parameters: ClaimExecutionJobParameters): Promise<ExecutionJob | null> {
    try {
      return await this.executionJobRepository.claimNextAvailable(parameters)
    } catch (error) {
      throw new ExecutionJobClaimError('Failed to claim next available execution job', { cause: error })
    }
  }

  async complete(id: string): Promise<boolean> {
    try {
      return await this.executionJobRepository.complete(id)
    } catch (error) {
      throw new ExecutionJobCompleteError('Failed to complete execution job', { cause: error })
    }
  }
  
  async fail(id: string): Promise<boolean> {
    try {
      return await this.executionJobRepository.fail(id)
    } catch (error) {
      throw new ExecutionJobFailError('Failed to fail execution job', { cause: error })
    }
  }
}
