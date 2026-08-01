// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NodeApplicationError } from '../../../error/error'

/**
 * Thrown when multiple {@link ExecutionJobHandler}s declare the same job kind.
 *
 * Raised by {@link ExecutionJobHandlerRegistry} during construction when
 * building the kind → handler map. Failing at bootstrap prevents ambiguous
 * routing once the Node starts claiming work.
 */
export class ExecutionJobHandlerAlreadyRegisteredError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for duplicate execution-job handler errors.
   */
  readonly code = 'EXECUTION_JOB_HANDLER_ALREADY_REGISTERED'

  /**
   * Job-kind discriminator that was registered more than once.
   */
  readonly kind: string

  // MARK: - Constructor

  /**
   * Creates an error describing a duplicate execution-job handler registration.
   *
   * @param kind - Job-kind discriminator claimed by more than one handler.
   * @param options - Optional error details, including the original cause.
   */
  constructor(kind: string, options?: ErrorOptions) {
    super(`Execution job handler already registered for kind: ${kind}`, options)

    this.kind = kind
  }
}

/**
 * Thrown when no {@link ExecutionJobHandler} is registered for a job kind.
 *
 * Raised by {@link ExecutionJobHandlerRegistry.resolve} when the claimed job's
 * kind is absent from the registry map. Distinct from transport or claim
 * failures: the Node received work, but dispatch has no handler for
 * {@link kind}.
 */
export class ExecutionJobHandlerNotFoundError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for missing execution-job handler errors.
   */
  readonly code = 'EXECUTION_JOB_HANDLER_NOT_FOUND'

  /**
   * Job-kind discriminator that could not be resolved.
   */
  readonly kind: string

  // MARK: - Constructor

  /**
   * Creates an error describing a missing execution-job handler.
   *
   * @param kind - Job-kind discriminator requested for resolution.
   * @param options - Optional error details, including the original cause.
   */
  constructor(kind: string, options?: ErrorOptions) {
    super(`Execution job handler not found for kind: ${kind}`, options)

    this.kind = kind
  }
}
