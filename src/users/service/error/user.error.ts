// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all user service–level errors.
 *
 * This abstract error represents failures that occur within the
 * user application layer and serves as a boundary
 * between orchestration logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent lower-level errors from leaking beyond the service layer.
 */
export abstract class UserServiceError extends Error {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying the type of
     * user service error.
     */
    abstract readonly code: string;
}

/**
 * Error thrown when a requested user cannot be found.
 *
 * This error is raised at the user service layer and should
 * be translated into a not-found response at the API boundary.
 */
export class UserNotFoundError extends UserServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying user-not-found errors.
     */
    readonly code = 'USER_NOT_FOUND';
}

/**
 * Error thrown when attempting to update a user status
 * to the same value.
 *
 * This error is raised at the user service layer and should
 * be translated into a bad-request response at the API boundary.
 */
export class UserStatusUnchangedError extends UserServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying user-status-unchanged errors.
     */
    readonly code = 'USER_STATUS_UNCHANGED';
}
