// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all bundle service–level errors.
 *
 * This abstract error represents failures that occur within the
 * bundle application layer and serves as a boundary
 * between orchestration logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent lower-level errors from leaking beyond the service layer.
 */
export abstract class BundleServiceError extends Error {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying the type of
     * bundle service error.
     */
    abstract readonly code: string;
}

/**
 * Thrown when a bundle registration is attempted but the bundle (or its identifier)
 * is already registered in the system.
 *
 * Use this to avoid duplicate registrations or conflicting bundle identity in the registry.
 */
export class BundleAlreadyRegisteredError extends BundleServiceError {
    // MARK: - Properties

    /**
     * Machine-readable code for duplicate bundle registration errors.
     */
    readonly code = 'BUNDLE_ALREADY_REGISTERED';
}