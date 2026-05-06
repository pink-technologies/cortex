// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all authentication service–level errors.
 *
 * This abstract error represents failures that occur within the
 * authentication application layer and serves as a boundary
 * between orchestration logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent lower-level errors from leaking beyond the service layer.
 */
export abstract class AuthenticationServiceError extends Error {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of
   * authentication service error.
   */
  abstract readonly code: string;

  /**
   * The underlying error that caused this authentication service error.
   *
   * This value is intended for internal use only (logging,
   * tracing, diagnostics) and must not be exposed directly
   * to API consumers.
   */
  readonly cause?: ErrorOptions;

  // MARK: - Constructor

  /**
   * Creates a new {@link AuthenticationServiceError} instance.
   *
   * @param message - A human-readable description of the authentication service error.
   * @param cause - The underlying error that triggered this failure.
   */
  constructor(message: string, cause?: ErrorOptions) {
    super(message);

    this.cause = cause;
    this.name = new.target.name;
  }
}

/**
 * Error thrown when an authentication operation is attempted
 * for a user account that is inactive.
 *
 * An inactive account may be temporarily or permanently disabled
 * due to administrative actions, policy enforcement, or
 * security-related reasons.
 *
 * This error is raised at the authentication service layer and
 * should be translated into a forbidden access response
 * at the API boundary.
 */
export class InactiveUserError extends AuthenticationServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying inactive
   * user account errors.
   */
  readonly code = 'INACTIVE_USER';

  // MARK: - Constructor

  /**
   * Creates a new {@link InactiveUserError} instance.
   *
   * @param cause - The underlying error that triggered this failure.
   */
  constructor(cause?: ErrorOptions) {
    super('The user account is inactive.', cause);
  }
}

/**
 * Error thrown when an authentication operation is attempted
 * for a user account that has not yet completed the
 * confirmation or verification process.
 *
 * This typically occurs when a user has successfully registered
 * but must still verify their account (for example, by entering
 * a confirmation code sent via email or SMS).
 *
 * This error is raised at the authentication service layer and
 * should be translated into a forbidden or challenge-required
 * response at the API boundary.
 */
export class PendingUserConfirmationError extends AuthenticationServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying
   * pending account confirmation errors.
   */
  readonly code = 'PENDING_CONFIRMATION';

  // MARK: - Constructor

  /**
   * Creates a new {@link PendingUserConfirmationError} instance.
   *
   * @param cause - The underlying error that triggered this failure.
   */
  constructor(cause?: ErrorOptions) {
    super('The user account is pending confirmation.', cause);
  }
}

/**
 * Error thrown when attempting to register a phone number that is
 * already associated with another user account.
 *
 * This error represents a conflict at the authentication service
 * layer and must not expose information about the existing account.
 */
export class PhoneAlreadyRegisteredError extends AuthenticationServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying phone number
   * registration conflicts.
   */
  readonly code = 'PHONE_ALREADY_REGISTERED';

  // MARK: - Constructor

  /**
   * Creates a new {@link PhoneAlreadyRegisteredError} instance.
   *
   * @param cause - The underlying error that triggered this failure.
   */
  constructor(cause?: ErrorOptions) {
    super('The phone number is already registered.', cause);
  }
}

export class UnauthorizedError extends AuthenticationServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying phone number
   * registration conflicts.
   */
  readonly code = 'UNAUTHORIZED';

  // MARK: - Constructor

  /**
   * Creates a new {@link UnauthorizedError} instance.
   *
   * @param cause - The underlying error that triggered this failure.
   */
  constructor(cause?: ErrorOptions) {
    super('Unauthorized.', cause);
  }
}

/**
 * Error thrown when attempting to register a user that already exists.
 *
 * This typically occurs when a unique identity attribute such as
 * email or username is already associated with an existing account.
 *
 * The error message must remain generic to avoid leaking
 * account existence details.
 */
export class UserAlreadyRegisteredError extends AuthenticationServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying duplicate user errors.
   */
  readonly code = 'USER_ALREADY_EXISTS';

  // MARK: - Constructor

  /**
   * Creates a new {@link UserAlreadyRegisteredError} instance.
   *
   * @param cause - The underlying error that triggered this failure.
   */
  constructor(cause?: ErrorOptions) {
    super('The user already exists.', cause);
  }
}

/**
 * Error thrown when attempting to perform an action on a user
 * that does not exist in the authentication system.
 *
 * This typically occurs when a requested user cannot be found
 * using a unique identity attribute such as email or username.
 *
 * The error message should remain generic to avoid leaking
 * account existence details.
 */
export class UserNotFoundError extends AuthenticationServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying user-not-found errors.
   */
  readonly code = 'USER_NOT_FOUND';

  // MARK: - Constructor

  /**
   * Creates a new {@link UserNotFoundError} instance.
   *
   * @param cause - The underlying error that triggered this failure.
   */
  constructor(cause?: ErrorOptions) {
    super('The user not found.', cause);
  }
}
