// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { forwardRef, Inject, Injectable, Optional } from '@nestjs/common'
import { NodesService } from '@/nodes/nodes.service'
import { FailExecutionJobRequest, type CompleteExecutionJobRequest } from '@cortex/protocol'
import type { DatabaseTransaction } from '@/infraestructure/database'
import { EXECUTION_JOB_REPOSITORY, type ExecutionJobRepository } from './execution-job-repository'
import { ExecutionJob } from './models/execution-job'
import { CreateExecutionJobParameters } from './parameters/create-execution-job-parameters'
import { validateExecutionJobResult } from './contracts/execution-job-result-contracts'
import { WorkflowOrchestrator } from '../workflow/orchestrator'
import {
  ExecutionJobCancelError,
  ExecutionJobClaimError,
  ExecutionJobCompleteError,
  ExecutionJobCreateError,
  ExecutionJobFailError,
  ExecutionJobReadError,
} from './error/error'

/**
 * Coordinates access to persisted execution jobs.
 *
 * The service delegates job claiming to the configured
 * {@link ExecutionJobRepository}, keeping execution orchestration independent
 * of the underlying persistence implementation. When a terminal transition
 * succeeds for a workflow-linked job, it notifies {@link WorkflowOrchestrator}.
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
   * @param workflowOrchestrator - Optional orchestrator notified after terminal
   * job transitions for workflow-linked jobs.
   */
  constructor(
    @Inject(EXECUTION_JOB_REPOSITORY)
    private readonly executionJobRepository: ExecutionJobRepository,
    private readonly nodesService: NodesService,
    @Optional()
    @Inject(forwardRef(() => WorkflowOrchestrator))
    private readonly workflowOrchestrator?: WorkflowOrchestrator,
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
        capabilities: [...executionNode.capabilities],
        labels: [...executionNode.labels],
        nodeId: executionNode.id,
        supportedKinds: [...executionNode.supportedKinds],
      }

      return await this.executionJobRepository.claimNextAvailable(parameters)
    } catch (error) {
      throw new ExecutionJobClaimError('Failed to claim next available execution job', { cause: error })
    }
  }

  /**
   * Marks a running execution job as completed.
   *
   * When the request carries a result, it is first validated against the
   * contract schema registered for the job's kind; the protocol treats results
   * as opaque, so this boundary is where kind-specific validation happens.
   * Delegates the guarded `RUNNING` → `COMPLETED` transition to the repository.
   * A `false` result indicates that the job does not exist or is no longer in
   * the required running state. On success, advances the owning workflow when
   * the job is linked to a run step.
   *
   * @param id - Stable identifier of the execution job to complete.
   * @param parameters - Completion request including claim proof and optional result.
   * @returns `true` when the transition succeeds; otherwise `false`.
   * @throws {ExecutionJobResultInvalidError} When the reported result violates
   *   the contract schema registered for the job's kind.
   * @throws {ExecutionJobCompleteError} When the persistence operation fails.
   */
  async complete(id: string, parameters: CompleteExecutionJobRequest): Promise<boolean> {
    let request = parameters

    if (parameters.result !== undefined) {
      const executionJob = await this.findById(id)

      if (!executionJob) {
        return false
      }

      request = { ...parameters, result: validateExecutionJobResult(executionJob.kind, parameters.result) }
    }

    try {
      const completed = await this.executionJobRepository.complete(id, request)

      if (completed) {
        await this.workflowOrchestrator?.onJobCompleted(id)
      }

      return completed
    } catch (error) {
      throw new ExecutionJobCompleteError('Failed to complete execution job', { cause: error })
    }
  }

  /**
   * Creates a queued execution job.
   *
   * Delegates persistence and default-value handling to the execution-job
   * repository.
   *
   * @typeParam Payload - Type of the execution-job payload.
   * @param parameters - Parameters describing the execution job to create.
   * @param options - Optional transaction client.
   * @returns The newly persisted execution job.
   * @throws ExecutionJobCreateError When the persistence operation fails.
   */
  async create<Payload>(
    parameters: CreateExecutionJobParameters<Payload>,
    options?: { transaction?: DatabaseTransaction },
  ): Promise<ExecutionJob> {
    try {
      return await this.executionJobRepository.create(parameters, options)
    } catch (error) {
      throw new ExecutionJobCreateError('Failed to create execution job', { cause: error })
    }
  }

  /**
   * Marks a running execution job as failed.
   *
   * Delegates the guarded `RUNNING` → `FAILED` transition to the repository.
   * A `false` result indicates that the job does not exist or is no longer in
   * the required running state. On success, fails the owning workflow when the
   * job is linked to a run step.
   *
   * @param id - Stable identifier of the execution job to fail.
   * @param parameters - Failure request including claim proof and failure payload.
   * @returns `true` when the transition succeeds; otherwise `false`.
   * @throws {ExecutionJobFailError} When the persistence operation fails.
   */
  async fail(id: string, parameters: FailExecutionJobRequest): Promise<boolean> {
    try {
      const failed = await this.executionJobRepository.fail(id, parameters)

      if (failed) {
        await this.workflowOrchestrator?.onJobFailed(id)
      }

      return failed
    } catch (error) {
      throw new ExecutionJobFailError('Failed to fail execution job', { cause: error })
    }
  }

  /**
   * Finds an execution job by its stable identifier.
   *
   * @param id - Execution-job identifier.
   * @returns The execution job, or `null` when it does not exist.
   * @throws ExecutionJobReadError When persistence access fails.
   */
  async findById(id: string): Promise<ExecutionJob | null> {
    try {
      return await this.executionJobRepository.findById(id)
    } catch (error) {
      throw new ExecutionJobReadError('Failed to retrieve execution job', { cause: error })
    }
  }

  /**
   * Requests cancellation of a workflow run's active execution jobs.
   *
   * `QUEUED` jobs move directly to `CANCELLED`; `RUNNING` jobs are flagged
   * with `cancellationRequestedAt` so the executing node can observe the
   * request. Terminal jobs are left unchanged.
   *
   * @param runId - Primary key of the owning workflow run.
   * @param options - Optional transaction client.
   * @throws ExecutionJobCancelError When the persistence operation fails.
   */
  async requestCancellationForRun(runId: string, options?: { transaction?: DatabaseTransaction }): Promise<void> {
    try {
      await this.executionJobRepository.requestCancellationForRun(runId, options)
    } catch (error) {
      throw new ExecutionJobCancelError('Failed to request execution job cancellation', { cause: error })
    }
  }
}
