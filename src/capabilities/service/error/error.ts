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
}

/**
 * Thrown when a capability registration is attempted but the capability (or its identifier)
 * is already registered in the system.
 *
 * Use this to avoid duplicate registrations or conflicting capability identity in the registry.
 */
export class CapabilityAlreadyRegisteredError extends CapabilitiesServiceError {
  // MARK: - Properties

  /**
   * Machine-readable code for duplicate capability registration errors.
   */
  readonly code = 'CAPABILITY_ALREADY_REGISTERED';
}

/**
 * Thrown when a capability fails to load from a file.
 */
export class CapabilityFileLoadError extends CapabilitiesServiceError {
  // MARK: - Properties

  /**
   * Machine-readable code for capability file load errors.
   */
  readonly code = 'CAPABILITY_FILE_LOAD_ERROR';
}