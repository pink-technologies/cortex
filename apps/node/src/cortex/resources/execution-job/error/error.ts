// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NodeApplicationError } from '../../../../error/error'
import type { CortexExecutionJobResource } from '../cortex-execution-job-resource'

/**
 * Thrown when claiming an execution job fails.
 *
 * Raised by {@link CortexExecutionJobResource.claimNextAvailable}. The
 * underlying networking failure is preserved in {@link Error.cause}.
 */
export class CortexExecutionJobClaimError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for execution-job claim failures.
   */
  readonly code = 'CORTEX_EXECUTION_JOB_CLAIM_ERROR'

  /**
   * Node id used for the claim request.
   */
  readonly nodeId: string

  // MARK: - Constructor

  /**
   * Creates an error describing a failed execution-job claim.
   *
   * @param nodeId - Node id used for the claim request.
   * @param options - Optional error details, including the original cause.
   */
  constructor(nodeId: string, options?: ErrorOptions) {
    super(`Failed to claim next execution job for node ${nodeId}`, options)

    this.nodeId = nodeId
  }
}

/**
 * Thrown when completing an execution job fails.
 *
 * Raised by {@link CortexExecutionJobResource.complete}. The underlying
 * networking failure is preserved in {@link Error.cause}.
 */
export class CortexExecutionJobCompleteError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for execution-job complete failures.
   */
  readonly code = 'CORTEX_EXECUTION_JOB_COMPLETE_ERROR'

  /**
   * Execution job id that could not be completed.
   */
  readonly jobId: string

  // MARK: - Constructor

  /**
   * Creates an error describing a failed execution-job complete.
   *
   * @param jobId - Execution job id targeted by the complete call.
   * @param options - Optional error details, including the original cause.
   */
  constructor(jobId: string, options?: ErrorOptions) {
    super(`Failed to complete execution job ${jobId}`, options)

    this.jobId = jobId
  }
}

/**
 * Thrown when failing an execution job fails.
 *
 * Raised by {@link CortexExecutionJobResource.fail}. The underlying networking
 * failure is preserved in {@link Error.cause}.
 */
export class CortexExecutionJobFailError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for execution-job fail failures.
   */
  readonly code = 'CORTEX_EXECUTION_JOB_FAIL_ERROR'

  /**
   * Execution job id that could not be marked failed.
   */
  readonly jobId: string

  // MARK: - Constructor

  /**
   * Creates an error describing a failed execution-job fail call.
   *
   * @param jobId - Execution job id targeted by the fail call.
   * @param options - Optional error details, including the original cause.
   */
  constructor(jobId: string, options?: ErrorOptions) {
    super(`Failed to mark execution job ${jobId} as failed`, options)

    this.jobId = jobId
  }
}
