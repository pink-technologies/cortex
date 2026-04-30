// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all organization service–level errors.
 *
 * This abstract error represents failures that occur within the
 * organization application layer and serves as a boundary
 * between orchestration logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent lower-level errors from leaking beyond the service layer.
 */
export abstract class OrganizationServiceError extends Error {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of
   * organization service error.
   */
  abstract readonly code: string;

  /**
   * The underlying error that caused this organization service error.
   *
   * This value is intended for internal use only (logging,
   * tracing, diagnostics) and must not be exposed directly
   * to API consumers.
   */
  readonly cause?: ErrorOptions;

  // MARK: - Constructor

  /**
   * Creates a new {@link OrganizationServiceError} instance.
   *
   * @param message - A human-readable description of the organization service error.
   * @param cause - The underlying error that triggered this failure.
   */
  constructor(message: string, cause?: ErrorOptions) {
    super(message);

    this.cause = cause;
    this.name = new.target.name;
  }
}

/**
 * Error thrown when a requested organization role cannot be found.
 *
 * This error is raised at the organization service layer and should
 * be translated into a not-found response at the API boundary.
 */
export class RoleNotFound extends OrganizationServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying role-not-found errors.
   */
  readonly code = 'ROLE_NOT_FOUND';

  // MARK: - Constructor

  /**
   * Creates a new {@link RoleNotFound} instance.
   *
   * @param cause - The underlying error that triggered this failure.
   */
  constructor(cause?: ErrorOptions) {
    super('Role not found.', cause);
  }
}
