// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for errors raised by the execution-job module.
 *
 * Subclasses expose a stable, machine-readable {@link code} while retaining a
 * human-readable message and optional diagnostic context. Transport layers can
 * map these errors to HTTP or RPC responses without depending on persistence
 * implementation details.
 */
export abstract class ExecutionJobModuleError extends Error {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for this error category.
   *
   * Consumers should branch on this value rather than parsing
   * {@link Error.message}.
   */
  abstract readonly code: string

  // MARK: - Constructor

  /**
   * Creates an execution-job module error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic options, including an underlying
   *   error in `cause`.
   */
  protected constructor(message: string, options?: ErrorOptions) {
    super(message, options)

    this.name = new.target.name
  }
}

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
 * Indicates that an unexpected failure occurred while requesting cancellation
 * of a run's execution jobs.
 *
 * This wraps operational failures thrown by the repository. Finding no
 * cancellable jobs is an expected outcome and is not represented by this
 * error.
 */
export class ExecutionJobCancelError extends ExecutionJobError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for execution-job cancellation failures.
   */
  readonly code = 'EXECUTION_JOB_CANCEL_ERROR'

  // MARK: - Constructor

  /**
   * Creates an execution-job cancellation error.
   *
   * @param message - Human-readable description of the cancellation failure.
   * @param errorOptions - Optional diagnostic options containing the
   *   originating failure in `cause`. These details are for internal logging
   *   and must not be exposed directly in public responses.
   */
  constructor(message: string, errorOptions?: ErrorOptions) {
    super(message, errorOptions)
  }
}

/**
 * Indicates that an unexpected failure occurred while creating (enqueueing) an
 * execution job.
 *
 * This wraps operational failures thrown by the repository during persistence.
 * Validation failures rejected before persistence should use the HTTP validation
 * path instead of this error.
 */
export class ExecutionJobCreateError extends ExecutionJobError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for execution-job creation failures.
   */
  readonly code = 'EXECUTION_JOB_CREATE_ERROR'

  // MARK: - Constructor

  /**
   * Creates an execution-job creation error.
   *
   * @param message - Human-readable description of the creation failure.
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

/**
 * Indicates that an unexpected failure occurred while reading an execution job.
 *
 * This wraps operational failures thrown by the repository during lookup. A
 * missing job returning `null` is an expected result and should not be
 * represented by this error.
 */
export class ExecutionJobReadError extends ExecutionJobError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for execution-job read failures.
   */
  readonly code = 'EXECUTION_JOB_READ_ERROR'

  // MARK: - Constructor

  /**
   * Creates an execution-job read error.
   *
   * @param message - Human-readable description of the read failure.
   * @param errorOptions - Optional diagnostic options containing the
   *   originating failure in `cause`. These details are for internal logging
   *   and must not be exposed directly in public responses.
   */
  constructor(message: string, errorOptions?: ErrorOptions) {
    super(message, errorOptions)
  }
}
