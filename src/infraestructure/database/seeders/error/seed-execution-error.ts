// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Error thrown when a seed operation fails.
 *
 * This error wraps the original exception to preserve context for
 * diagnostics while keeping a stable error type for CLI consumers.
 */
export class SeedExecutionError extends Error {

  /**
   * The underlying error that triggered the seed failure.
   */
  readonly cause?: ErrorOptions;

  // MARK: - Constructor

  /**
   * Creates a new {@link SeedExecutionError}.
   *
   * @param message - The human-readable error message describing the failure.
   * @param options - Optional {@link ErrorOptions} forwarded to the native `Error` constructor (typically `{ cause }`).
   */
  constructor(message: string, cause?: ErrorOptions) {
    super(message);
    this.cause = cause;
    this.name = new.target.name;
  }
}
