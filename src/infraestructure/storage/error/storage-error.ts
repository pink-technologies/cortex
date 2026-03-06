// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all storage-related errors.
 *
 * This abstract error represents failures that occur within the
 * storage infrastructure layer and serves as a boundary
 * between persistence concerns and higher application layers
 * (e.g. services, use cases).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - prevent lower-level storage errors from leaking beyond the storage layer.
 */
export abstract class StorageError extends Error {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of storage failure.
   */
  abstract readonly code: string;

  /**
   * The underlying error that caused this storage failure.
   *
   * This value is intended for internal use only (logging,
   * tracing, diagnostics) and must not be exposed directly
   * to API consumers.
   */
  readonly cause?: unknown;

  // MARK: - Constructor

  /**
   * Creates a new {@link StorageError} instance.
   *
   * @param message - A human-readable description of the storage error.
   * @param cause - The underlying error that triggered this failure.
   */
  constructor(
    message = 'An unexpected storage error occurred.',
    cause?: unknown,
  ) {
    super(message);

    this.cause = cause;
    this.name = new.target.name;
  }
}

/**
 * Error thrown when a delete operation fails.
 *
 * This typically occurs when the storage backend is unavailable
 * or the operation times out before completion.
 */
export class StorageDeleteError extends StorageError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying storage delete failures.
   */
  readonly code = 'DELETE_FAILED';
}

/**
 * Error thrown when storage initialization fails.
 *
 * This typically occurs when the storage backend cannot be reached
 * (e.g. Redis connection refused, connection timeout, invalid configuration).
 */
export class StorageInitializationError extends StorageError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying storage initialization failures.
   */
  readonly code = 'INITIALIZATION_FAILED';
}

/**
 * Error thrown when a read operation fails.
 *
 * This typically occurs when the storage backend is unavailable,
 * the requested key does not exist in a non-nullable context,
 * or a serialization/deserialization error happens during the read.
 */
export class StorageReadError extends StorageError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying storage read failures.
   */
  readonly code = 'READ_FAILED';
}

/**
 * Error thrown when a write operation fails.
 *
 * This typically occurs when the storage backend is unavailable,
 * a quota or memory limit is exceeded, or the value cannot be serialized.
 */
export class StorageWriteError extends StorageError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying storage write failures.
   */
  readonly code = 'WRITE_FAILED';
}
