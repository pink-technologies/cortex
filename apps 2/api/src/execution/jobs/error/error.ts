// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ExecutionJobModuleError } from '../../error/execution-module-error'

/**
 * Base class for errors raised specifically by execution-job operations.
 *
 * This intermediate type lets exception filters catch all job-related failures
 * without also catching errors from other parts of the execution module.
 * Concrete subclasses must provide the machine-readable `code` required by
 * {@link ExecutionJobModuleError}.
 */
export abstract class ExecutionJobError extends ExecutionJobModuleError {}

/**
 * Indicates that an unexpected failure occurred while attempting to claim an
 * available execution job.
 *
 * This represents an operational error from the repository or orchestration
 * layer. It does not represent the normal “no compatible job is currently
 * available” outcome, which the claim operation returns as `null`.
 */
export class ExecutionJobClaimError extends ExecutionJobError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier used by filters, logs, and clients to
   * distinguish claim failures from other execution-job errors.
   */
  readonly code = 'EXECUTION_JOB_CLAIM_ERROR'

  // MARK: - Constructor

  /**
   * Creates an execution-job claim error.
   *
   * @param message - Human-readable description of the claim failure.
   * @param errorOptions - Optional diagnostic options containing the originating
   *   failure in `cause`. This context is for internal logging and should not
   *   be exposed directly in public responses.
   */
  constructor(message: string, errorOptions?: ErrorOptions) {
    super(message, errorOptions)
  }
}

/**
 * Indicates that an unexpected failure occurred while marking a running job as
 * completed.
 *
 * This wraps operational failures thrown by the repository. A guarded
 * transition returning `false` because the job is missing or not `RUNNING` is
 * an expected result and should not be represented by this error.
 */
export class ExecutionJobCompleteError extends ExecutionJobError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for execution-job completion failures.
   */
  readonly code = 'EXECUTION_JOB_COMPLETE_ERROR'

  // MARK: - Constructor

  /**
   * Creates an execution-job completion error.
   *
   * @param message - Human-readable description of the completion failure.
   * @param errorOptions - Optional diagnostic options containing the
   *   originating failure in `cause`. These details are for internal logging
   *   and must not be exposed directly in public responses.
   */
  constructor(message: string, errorOptions?: ErrorOptions) {
    super(message, errorOptions)
  }
}

/**
 * Indicates that an unexpected failure occurred while marking a running job as
 * failed.
 *
 * This wraps operational failures thrown by the repository. A guarded
 * transition returning `false` because the job is missing or not `RUNNING` is
 * an expected result and should not be represented by this error.
 */
export class ExecutionJobFailError extends ExecutionJobError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for execution-job failure-transition
   * errors.
   */
  readonly code = 'EXECUTION_JOB_FAIL_ERROR'

  // MARK: - Constructor

  /**
   * Creates an execution-job failure-transition error.
   *
   * @param message - Human-readable description of the transition failure.
   * @param errorOptions - Optional diagnostic options containing the
   *   originating failure in `cause`. These details are for internal logging
   *   and must not be exposed directly in public responses.
   */
  constructor(message: string, errorOptions?: ErrorOptions) {
    super(message, errorOptions)
  }
}