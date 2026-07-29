// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { EXECUTION_JOB_REPOSITORY, type ExecutionJobRepository } from './execution-job-repository'
import { ExecutionJobClaimError, ExecutionJobCompleteError, ExecutionJobFailError } from './error/error'
import { ExecutionJob } from './models/execution-job'
import { NodesService } from '@/nodes/nodes.service'

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
   * @param nodesService - Service used to resolve the execution node.
   */
  constructor(
    @Inject(EXECUTION_JOB_REPOSITORY)
    private readonly executionJobRepository: ExecutionJobRepository,    

    @Inject()
    private readonly nodesService: NodesService,
  ) {}

  // MARK: - Instance methods

  /**
   * Claims the next available execution job for the given parameters.
   *
   * @param parameters - The parameters for claiming the next available execution job.
   * @returns The claimed execution job, or `null` if no execution job is available.
   * @throws ExecutionJobClaimError If initiating the claim operation fails.
   */
  async claimNextAvailable(nodeId: string): Promise<ExecutionJob | null> {
    try {      
      const executionNode = await this.nodesService.resolveForExecution(nodeId)
      const parameters = {
        capabilities: [
          ...executionNode.capabilities,
        ],
        labels: [
          ...executionNode.labels,
        ],
        nodeId:
          executionNode.id,
        supportedKinds: [
          ...executionNode.supportedKinds,
        ],
      }

      return await this.executionJobRepository.claimNextAvailable(parameters)
    } catch (error) {
      throw new ExecutionJobClaimError('Failed to claim next available execution job', { cause: error })
    }
  }

  /**
   * Marks a running execution job as completed.
   *
   * Delegates the guarded `RUNNING` → `COMPLETED` transition to the repository.
   * A `false` result indicates that the job does not exist or is no longer in
   * the required running state.
   *
   * @param id - Stable identifier of the execution job to complete.
   * @returns `true` when the transition succeeds; otherwise `false`.
   * @throws {ExecutionJobCompleteError} When the persistence operation fails.
   */
  async complete(id: string): Promise<boolean> {
    try {
      return await this.executionJobRepository.complete(id)
    } catch (error) {
      throw new ExecutionJobCompleteError('Failed to complete execution job', { cause: error })
    }
  }

  /**
   * Marks a running execution job as failed.
   *
   * Delegates the guarded `RUNNING` → `FAILED` transition to the repository.
   * A `false` result indicates that the job does not exist or is no longer in
   * the required running state.
   *
   * @param id - Stable identifier of the execution job to fail.
   * @returns `true` when the transition succeeds; otherwise `false`.
   * @throws {ExecutionJobFailError} When the persistence operation fails.
   */
  async fail(id: string): Promise<boolean> {
    try {
      return await this.executionJobRepository.fail(id)
    } catch (error) {
      throw new ExecutionJobFailError('Failed to fail execution job', { cause: error })
    }
  }
}
