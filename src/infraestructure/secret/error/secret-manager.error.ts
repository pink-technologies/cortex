// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base error type for secret manager-related failures.
 *
 * This error represents failures that occur within an {@link SecretManager}
 * implementation and serves as a normalized abstraction over provider-specific
 * errors.
 *
 * Implementations should throw this error (or a subclass of it) instead of
 * propagating provider-specific exceptions directly. This ensures that the
 * application layer remains decoupled from underlying secret manager mechanisms
 * and can handle secret manager failures in a consistent manner.
 *
 * This error type is intentionally generic and may be extended to model more
 * specific secret manager failure scenarios when needed.
 */
export abstract class SecretManagerError extends Error {
  // Properties

  /**
   * A machine-readable error code identifying the type of secret manager error.
   */
  abstract readonly code: string

  /**
   * The underlying error that caused this secret manager failure.
   *
   * This value is intended for internal use (logging,
   * tracing, diagnostics) and must not be exposed directly
   * to clients.
   */
  readonly cause?: ErrorOptions

  // Constructor

  /**
   * Creates a new {@link SecretManagerError} instance.
   *
   * The provided message should describe the secret manager failure in a
   * provider-agnostic manner.
   *
   * @param message - A human-readable description of the secret manager error.
   * @param cause - The underlying error that caused this secret manager failure.
   */
  protected constructor(message: string, cause?: ErrorOptions) {
    super(message)

    this.cause = cause;
    this.name = new.target.name
  }
}

/**
 * Error thrown when a secret manager is not able to create a secret.
 *
 * This error is typically raised when the secret manager is not able to create a secret.
 */
export class CreateSecretError extends SecretManagerError {
  // Properties

  /**
   * A machine-readable error code identifying the type of secret manager error.
   */
  readonly code = 'CREATE_SECRET_ERROR'

  // Constructor

  /**
   * Creates a new {@link CreateSecretError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the secret manager error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('Failed to create the secret.', cause)
  }
}

/**
 * Error thrown when a secret manager is not able to get a secret.
 *
 * This error is typically raised when the secret manager is not able to get a secret.
 */
export class GetSecretByRefError extends SecretManagerError {
  // Properties

  /**
   * A machine-readable error code identifying the type of secret manager error.
   */
  readonly code = 'GET_SECRET_BY_REF_ERROR'

  // Constructor

  /**
   * Creates a new {@link GetSecretByRefError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the secret manager error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('Failed to get the secret by reference.', cause)
  }
}

/**
 * Error thrown when a secret manager is not able to update a secret.
 *
 * This error is typically raised when the secret manager is not able to update a secret.
 */
export class UpdateSecretError extends SecretManagerError {
  // Properties

  /**
   * A machine-readable error code identifying the type of secret manager error.
   */
  readonly code = 'UPDATE_SECRET_ERROR'

  // Constructor

  /**
   * Creates a new {@link UpdateSecretError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the secret manager error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('Failed to update the secret.', cause)
  }
}
