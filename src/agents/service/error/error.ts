// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all agent service–level errors.
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
export abstract class AgentServiceError extends Error {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of
   * agent service error.
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
   * Creates a new {@link AgentServiceError} instance.
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
 * Thrown when the agents subsystem fails to start up (for example module wiring,
 * registry bootstrap, or loading persisted agent configuration).
 *
 * The optional {@link cause} preserves the original failure for logging and
 * diagnostics without exposing it as the primary service error.
 */
export class AgentsInitializationError extends AgentServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of
   * agent service error.
   */
  readonly code = 'AGENTS_INITIALIZATION_ERROR';

  // MARK: - Initializer

  /**
   * Creates an agents initialization error.
   *
   * - Parameter message: A human-readable description of the failure.
   * - Parameter cause: The underlying error that originated this domain error.
   */
  constructor(message: string, cause?: unknown) {
    super(message, cause)
  }
}

/**
 * Thrown when loading the MAIN orchestrator from storage fails for a reason other
 * than a simple absence of data — for example I/O errors, driver failures, or
 * unexpected exceptions from {@link Storage.read}.
 *
 * Prefer {@link MainAgentNotFoundError} when the main id is missing or the row
 * is absent; use this error when the read itself fails and {@link cause} should
 * carry the underlying failure for diagnostics.
 */
export class FailedToGetMainAgentError extends AgentServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of
   * agent service error.
   */
  readonly code = 'FAILED_TO_GET_MAIN_AGENT_ERROR';

  // MARK: - Initializer

  /**
   * Creates an failed to get main agent error.
   *
   * - Parameter message: A human-readable description of the failure.
   * - Parameter cause: The underlying error that originated this domain error.
   */
  constructor(message: string, cause?: unknown) {
    super(message, cause)
  }
}