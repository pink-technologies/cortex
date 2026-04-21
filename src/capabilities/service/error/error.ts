// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all capability service–level errors.
 *
 * This abstract error represents failures that occur within the
 * capability application layer and serves as a boundary
 * between orchestration logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent lower-level errors from leaking beyond the service layer.
 */
export abstract class CapabilitiesServiceError extends Error {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of
   * capability service error.
   */
  abstract readonly code: string;

  /**
   * The underlying error that originated this domain error.
   *
   * This value is intended for diagnostics, logging, and debugging,
   * and should generally not be exposed directly to consumers.
  */
  readonly cause?: unknown

  // MARK: - Initializer

  /**
   * Creates a new {@link CapabilitiesServiceError} instance.
   *
   * - Parameter message: A human-readable description of the failure.
   * - Parameter cause: The underlying error that originated this domain error.
   */
  protected constructor(message: string, cause?: unknown) {
    super(message)
    
    this.cause = cause
  }
}

/**
 * Thrown when the capabilities subsystem fails to start up (for example module wiring,
 * registry bootstrap, or loading persisted capability configuration).
 *
 * The optional {@link cause} preserves the original failure for logging and
 * diagnostics without exposing it as the primary service error.
 */
export class CapabilitiesInitializationError extends CapabilitiesServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of
   * agent service error.
   */
  readonly code = 'CAPABILITIES_INITIALIZATION_ERROR';

  // MARK: - Initializer

  /**
    * Creates an API key not configured error.
    *
    * - Parameter message: A human-readable description of the failure.
    * - Parameter cause: The underlying error that originated this domain error.
    */
  constructor(message: string, cause?: unknown) {
      super(message, cause)
  }
}