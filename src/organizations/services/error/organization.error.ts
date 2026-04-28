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
}
