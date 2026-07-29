// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all agent-runtime errors.
 *
 * This abstract error represents failures that occur within the
 * agent application layer and serves as a boundary
 * between orchestration logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent lower-level errors from leaking beyond the service layer.
 */
export abstract class AgentRuntimeError extends Error {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of
   * agent-runtime error.
   */
  abstract readonly code: string;

  /**
   * The underlying error that originated this domain error.
   *
   * This value is intended for diagnostics, logging, and debugging,
   * and should generally not be exposed directly to consumers.
   */
  readonly cause?: ErrorOptions;

  // MARK: - Initializer

  /**
   * Creates a new {@link AgentRuntimeError} instance.
   *
   * @param message - A human-readable description of the failure.
   * @param cause - Optional error details, including the original cause.
   */
  protected constructor(message: string, cause?: ErrorOptions) {
    super(message);

    this.cause = cause;
  }
}
