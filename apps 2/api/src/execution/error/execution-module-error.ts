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