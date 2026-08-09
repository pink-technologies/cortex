// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { NodesService } from '@/nodes/nodes.service'
import { FailExecutionJobRequest, type CompleteExecutionJobRequest } from '@cortex/protocol'
import type { DatabaseTransaction } from '@/infraestructure/database'
import { EXECUTION_JOB_REPOSITORY, type ExecutionJobRepository } from './execution-job-repository'
import { ExecutionJob } from './models/execution-job'
import { CreateExecutionJobParameters } from './parameters/create-execution-job-parameters'
import { hasExecutionJobResultContract, validateExecutionJobResult } from './contracts/execution-job-result-contracts'
import { WORKFLOW_JOB_LIFECYCLE, type WorkflowJobLifecycle } from './ports'
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
 * of the underlying persistence implementation. When a claim or terminal
 * transition succeeds for a workflow-linked job, it notifies the required
 * {@link WorkflowJobLifecycle} port.
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
   * @param workflowJobLifecycle - Workflow boundary notified after claim and
   * terminal job transitions for workflow-linked jobs.
   */
  constructor(
    @Inject(EXECUTION_JOB_REPOSITORY)
    private readonly executionJobRepository: ExecutionJobRepository,
    private readonly nodesService: NodesService,
    @Inject(forwardRef(() => WORKFLOW_JOB_LIFECYCLE))
    private readonly workflowJobLifecycle: WorkflowJobLifecycle,
  ) {}

  // MARK: - Instance methods

  /**
   * Claims the next available execution job for the given parameters.
   *
   * On a successful claim of a workflow-linked job, notifies
   * {@link WorkflowJobLifecycle} so the owning step moves `QUEUED` →
   * `RUNNING`.
   *
   * @param nodeId - Identifier of the node requesting work.
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

      const executionJob = await this.executionJobRepository.claimNextAvailable(parameters)

      if (executionJob?.runId != null && executionJob.stepId != null) {
        await this.workflowJobLifecycle.onJobClaimed(executionJob.id)
      }

      return executionJob
    } catch (error) {
      throw new ExecutionJobClaimError('Failed to claim next available execution job', { cause: error })
    }
  }

  /**
   * Marks a running execution job as completed.
   *
   * For kinds with a registered result contract, `result` is required and is
   * validated before persistence. Kinds without a contract may omit a result.
   * Delegates the guarded `RUNNING` → `COMPLETED` transition to the repository.
   * A `false` result indicates that the job does not exist or is no longer in
   * the required running state. On success, advances the owning workflow when
   * the job is linked to a run step.
   *
   * @param id - Stable identifier of the execution job to complete.
   * @param parameters - Completion request including claim proof and optional result.
   * @returns `true` when the transition succeeds; otherwise `false`.
   * @throws {ExecutionJobResultInvalidError} When a contract-bearing kind is
   *   missing a result or the reported result violates its schema.
   * @throws {ExecutionJobCompleteError} When the persistence operation fails.
   */
  async complete(id: string, parameters: CompleteExecutionJobRequest): Promise<boolean> {
    const executionJob = await this.findById(id)

    if (!executionJob) {
      return false
    }

    let request = parameters

    if (hasExecutionJobResultContract(executionJob.kind) || parameters.result !== undefined) {
      request = {
        ...parameters,
        result: validateExecutionJobResult(executionJob.kind, parameters.result),
      }
    }

    try {
      const completed = await this.executionJobRepository.complete(id, request)

      if (completed) {
        await this.workflowJobLifecycle.onJobCompleted(id)
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
   * Loads the earliest job linked to a workflow step.
   *
   * @param stepId - Owning workflow step primary key.
   * @param options - Optional transaction client.
   * @returns The domain job when found; otherwise `null`.
   * @throws ExecutionJobReadError When the persistence operation fails.
   */
  async findByStepId(stepId: string, options?: { transaction?: DatabaseTransaction }): Promise<ExecutionJob | null> {
    try {
      return await this.executionJobRepository.findByStepId(stepId, options)
    } catch (error) {
      throw new ExecutionJobReadError('Failed to read execution job by step', { cause: error })
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
        await this.workflowJobLifecycle.onJobFailed(id)
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
