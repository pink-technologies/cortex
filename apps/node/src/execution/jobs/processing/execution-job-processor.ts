// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import { ExecutionJobHandlerRegistry } from '../../handler'
import {
  type AgentExecuteJobResult,
  type ClaimExecutionJobResponse,
  type JiraTriageJobResult,
  type RepositoryReviewJobResult,
} from '@cortex/protocol'

/**
 * Execution job returned when a claim succeeds with work available.
 *
 * Narrows {@link ClaimExecutionJobResponse.job} to the non-null case so
 * handlers can assume a concrete job payload after the poller filters empty
 * claims.
 */
export type ClaimedExecutionJob = NonNullable<ClaimExecutionJobResponse['job']>

/**
 * Result produced by processing an execution job.
 *
 * Result-producing kinds return the contract result for their kind:
 * {@link AgentExecuteJobResult} (`agent.execute`),
 * {@link JiraTriageJobResult} (`jira.triage`), or
 * {@link RepositoryReviewJobResult} (`repository.review`). Kinds that produce
 * no protocol result, such as `"system.test"`, resolve to `undefined`.
 */
export type ExecutionJobProcessingResult =
  | AgentExecuteJobResult
  | JiraTriageJobResult
  | RepositoryReviewJobResult
  | undefined

/**
 * Dispatches a claimed execution job to the handler for its kind.
 *
 * This is the Node's job-execution boundary after a successful claim. It
 * resolves the handler for {@link ClaimedExecutionJob.kind} through
 * {@link ExecutionJobHandlerRegistry}, runs it, and honors cancellation
 * through {@link AbortSignal}. Lifecycle reporting stays with the polling
 * layer so this class remains an execution dispatcher.
 *
 * Responsibilities:
 * - resolve the handler registered for the claimed job's kind
 * - abort early when the provided signal is already cancelled
 * - forward the job payload and execution context to the handler
 *
 * Non-responsibilities:
 * - claiming jobs from the Cortex API
 * - polling cadence or sequential claim loops
 * - marking jobs completed or failed
 */
@Injectable()
export class ExecutionJobProcessor {
  // MARK: - Constructor

  /**
   * Creates an execution-job processor.
   *
   * @param executionJobHandlerRegistry - Registry used to resolve handlers by kind.
   */
  constructor(private readonly executionJobHandlerRegistry: ExecutionJobHandlerRegistry) {}

  // MARK: - Instance Methods

  /**
   * Processes a claimed execution job according to its kind.
   *
   * The handler registered for the job's kind receives the opaque payload and
   * an execution context carrying the job id and cancellation signal. Unknown
   * kinds fail closed so unsupported work is not silently ignored.
   *
   * @param job - Claimed execution job to process.
   * @param signal - Signal used to cancel the execution.
   * @returns The kind-specific result, or `undefined` when no result is produced.
   * @throws {DOMException} When the provided signal is aborted.
   * @throws {@link ExecutionJobHandlerNotFoundError} When no handler is
   *   registered for the job's kind.
   */
  async process(job: ClaimedExecutionJob, signal: AbortSignal): Promise<ExecutionJobProcessingResult> {
    signal.throwIfAborted()

    const handler = this.executionJobHandlerRegistry.resolve(job.kind)

    return handler.process(job.payload, {
      executionId: job.id,
      signal,
    })
  }
}
