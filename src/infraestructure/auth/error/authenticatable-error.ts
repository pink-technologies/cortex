// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base error type for authentication-related failures.
 *
 * This error represents failures that occur within an {@link Authenticatable}
 * implementation and serves as a normalized abstraction over provider-specific
 * errors.
 *
 * Implementations should throw this error (or a subclass of it) instead of
 * propagating provider-specific exceptions directly. This ensures that the
 * application layer remains decoupled from underlying authentication mechanisms
 * and can handle authentication failures in a consistent manner.
 *
 * Typical use cases include:
 * - invalid credentials,
 * - expired or invalid tokens,
 * - failed confirmation codes,
 * - password policy violations,
 * - unauthorized or forbidden authentication actions.
 *
 * This error type is intentionally generic and may be extended to model more
 * specific authentication failure scenarios when needed.
 */
export abstract class AuthenticatableError extends Error {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  abstract readonly code: string;

  /**
   * The underlying error that caused this authentication failure.
   *
   * This value is intended for internal use only (logging,
   * tracing, diagnostics) and must not be exposed directly
   * to API consumers.
   */
  readonly cause?: ErrorOptions;

  // Constructor

  /**
   * Creates a new {@link AuthenticatableError} instance.
   *
   * The provided message should describe the authentication failure in a
   * provider-agnostic manner and must not include sensitive information
   * such as credentials, tokens, or confirmation codes.
   *
   * @param message - A human-readable description of the authentication error.
   * @param options - Optional {@link ErrorOptions} forwarded to the native `Error` constructor (typically `{ cause }`).
   */
  protected constructor(message: string, cause?: ErrorOptions) {
    super(message);

    this.cause = cause;
    this.name = new.target.name;
  }
}

/**
 * Error thrown when an authentication flow requires an additional challenge
 * to be completed before it can succeed.
 *
 * This error is typically raised during sign-in when the identity provider
 * determines that further verification is required, such as:
 *
 * - Multi-factor authentication (MFA),
 * - Password change required,
 * - Custom authentication challenges,
 * - Email or phone number verification steps.
 *
 * This error represents a **non-terminal authentication state**. The
 * authentication attempt has not failed, but cannot be completed until the
 * required challenge is satisfied.
 *
 * Security considerations:
 * - This error does not expose challenge details or sensitive provider data.
 * - The application layer should use this error to drive the appropriate
 *   challenge-response flow (e.g. prompt for MFA code).
 *
 * The underlying provider-specific error or response (if any) is captured
 * as the {@link AuthenticatableError#cause} for internal diagnostics and
 * logging purposes.
 */
export class ChallengeRequiredError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'CHALLENGE_REQUIRED';

  // Constructor

  /**
   * Creates a new {@link ChallengeRequiredError} instance.
   *
   * @param challengeName - The name of the required challenge (e.g. "SMS_MFA").
   * @param session - An optional session identifier to be used in subsequent challenge responses.
   */
  constructor(
    public readonly challengeName: string,
    public readonly session: string,
  ) {
    super('Additional challenge is required to complete authentication.');
  }
}

/**
 * Error thrown when a forgot-password confirmation operation fails.
 *
 * This error represents a failure that occurs while attempting to
 * complete the password reset flow by validating the confirmation
 * code and setting a new password.
 *
 * Typical scenarios include:
 * - an invalid or expired confirmation code,
 * - the account being in an unexpected or invalid state,
 * - the authentication provider rejecting the new password,
 * - transient service or network failures.
 *
 * This error should be used as a fallback when no more specific
 * {@link AuthenticatableError} subtype applies.
 */
export class ConfirmForgotPasswordError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'CONFIRM_FORGOT_PASSWORD_ERROR';

  // Constructor

  /**
   * Creates a new {@link ConfirmForgotPasswordError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the invalid credentials error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('Failed to confirm the new password.', cause);
  }
}

/**
 * Error thrown when a sign-up confirmation operation fails.
 *
 * This error represents a failure that occurs while attempting to
 * confirm a newly created user account using a verification or
 * confirmation code.
 *
 * Typical scenarios include:
 * - an invalid or expired confirmation code,
 * - the account being in an unexpected or invalid state,
 * - the authentication provider rejecting the confirmation request,
 * - transient service or network failures.
 */
export class ConfirmSignupError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'CONFIRM_SIGNUP_ERROR';

  // Constructor

  /**
   * Creates a new {@link ConfirmSignupError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the invalid credentials error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('Failed to confirm sign-up.', cause);
  }
}

/**
 * Error thrown when an authentication token cannot be decoded.
 *
 * This error represents a failure that occurs while attempting to
 * parse or interpret an authentication token into a normalized
 * token payload.
 *
 * Typical scenarios include:
 * - malformed or corrupted token values,
 * - missing or unexpected token claims,
 * - unsupported token formats,
 * - failures during token parsing or validation,
 * - transient decoding or cryptographic errors.
 *
 * This error should be used as a fallback when no more specific
 * {@link AuthenticatableError} subtype applies.
 */
export class DecodeTokenError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'DECODE_TOKEN_ERROR';

  // Constructor

  /**
   * Creates a new {@link DecodeTokenError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the invalid credentials error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('Failed to decode the token.', cause);
  }
}

/**
 * Error thrown when a password recovery operation fails.
 *
 * This error represents a generic failure that occurs while attempting
 * to initiate the "forgot password" flow for a user account.
 *
 * Typical scenarios include:
 * - the authentication provider rejecting the request,
 * - transient service or network failures,
 * - misconfiguration preventing password recovery operations.
 *
 * This error should be used as a fallback when no more specific
 * {@link AuthenticatableError} subtype applies.
 */
export class ForgotPasswordError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'FORGOT_PASSWORD_ERROR';

  // Constructor

  /**
   * Creates a new {@link ForgotPasswordError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the new password required error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('Failed to initiate forgot password flow.', cause);
  }
}

/**
 * Error thrown when the provided authentication credentials are invalid.
 *
 * This error indicates that the authentication attempt failed because the
 * supplied credentials do not match any existing account or are incorrect.
 *
 * Security considerations:
 * - This error intentionally does not disclose which credential field was invalid
 *   (e.g. username vs password) to prevent account enumeration attacks.
 * - Implementations should ensure this error is returned for all generic
 *   authentication failures where additional detail would reduce security.
 */
export class InvalidCredentialsError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'INVALID_CREDENTIALS';

  // Constructor

  /**
   * Creates a new {@link InvalidCredentialsError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the invalid credentials error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('The provided credentials are invalid.', cause);
  }
}

/**
 * Error thrown when an authentication provider reports that the user
 * already exists.
 *
 * This error should be mapped at the application layer into the
 * appropriate domain or service-level error to avoid leaking provider
 * details.
 */
export class ProviderUserAlreadyExistsError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'USER_ALREADY_EXISTS';

  // Constructor

  /**
   * Creates a new {@link ProviderUserAlreadyExistsError} instance.
   *
   * @param cause - The underlying provider error that triggered this failure.
   */
  constructor(cause: ErrorOptions) {
    super('User already exists.', cause);
  }
}

/**
 * Error thrown when an authentication provider reports that the user
 * could not be found.
 *
 * This error should be mapped at the application layer into the
 * appropriate domain or service-level error to avoid leaking provider
 * details.
 */
export class ProviderUserNotFoundError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'USER_NOT_FOUND';

  // Constructor

  /**
   * Creates a new {@link ProviderUserNotFoundError} instance.
   *
   * @param cause - The underlying provider error that triggered this failure.
   */
  constructor(cause: ErrorOptions) {
    super('User not found.', cause);
  }
}

/**
 * Error thrown when an invalid or expired verification code is provided
 * during an authentication flow.
 *
 * This error typically occurs when the confirmation code:
 * - is incorrect,
 * - has expired,
 * - has already been used, or
 * - does not match the expected authentication context.
 */
export class InvalidCodeError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'INVALID_CODE';

  // Constructor

  /**
   * Creates a new {@link InvalidCodeError} instance.
   *
   * The error message is intentionally generic to avoid leaking
   * provider-specific details while remaining meaningful to clients.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the invalid code error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('The provided verification code is invalid or has expired.', cause);
  }
}

/**
 * Error thrown when authentication-related input parameters are invalid
 * or malformed.
 *
 * This error represents failures caused by structurally incorrect,
 * missing, or improperly formatted input values that prevent an
 * authentication operation from being executed.
 *
 * Typical scenarios include:
 * - missing required parameters,
 * - invalid parameter formats (e.g. malformed email),
 * - unsupported or unexpected input values.
 */
export class InvalidParametersError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'INVALID_PARAMETERS';

  // Constructor

  /**
   * Creates a new {@link InvalidParametersError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the invalid credentials error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('Invalid or malformed parameters.', cause);
  }
}

/**
 * Error thrown when an authentication operation fails because
 * the provided password does not meet the required criteria.
 *
 * This error typically occurs during sign-up or password update
 * operations when the password violates defined security or
 * complexity rules.
 *
 * This error is provider-agnostic and should be used to normalize
 * password validation failures originating from underlying
 * authentication providers.
 */
export class InvalidPasswordError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'INVALID_PASSWORD';

  // Constructor

  /**
   * Creates a new {@link InvalidPasswordError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the invalid credentials error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('The provided password is invalid.', cause);
  }
}

/**
 * Error thrown when a new password is required to complete the authentication
 * process.
 *
 * This error is typically raised during sign-in when the identity provider
 * determines that the user's password must be changed before access can be
 * granted. Common scenarios include:
 *
 * - Initial sign-in with a temporary password,
 * - Password reset flows requiring the user to set a new password,
 * - Administrative password resets that mandate a change on next login.
 *
 * This error represents a **non-terminal authentication state**. The
 * authentication attempt has not failed, but cannot be completed until the
 * user provides a new password.
 *
 * Security considerations:
 * - This error does not expose sensitive provider data.
 * - The application layer should use this error to prompt the user to set
 *   a new password.
 *
 * The underlying provider-specific error or response (if any) is captured
 * as the {@link NewPasswordRequiredError} for internal diagnostics and
 * logging purposes.
 */
export class NewPasswordRequiredError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'NEW_PASSWORD_REQUIRED';

  // Constructor

  /**
   * Creates a new {@link NewPasswordRequiredError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the new password required error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('A new password is required.', cause);
  }
}

/**
 * Error thrown when an authentication token refresh operation fails.
 *
 * This error represents a generic failure that occurs while attempting
 * to obtain new authentication tokens using a refresh token.
 *
 * Typical scenarios include:
 * - an expired, revoked, or otherwise invalid refresh token,
 * - the authentication provider rejecting the refresh request,
 * - transient service or network failures.
 *
 * This error should be used as a fallback when no more specific
 * {@link AuthenticatableError} subtype applies.
 */
export class RefreshTokenError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'REFRESH_TOKEN_ERROR';

  // Constructor

  /**
   * Creates a new {@link RefreshTokenError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the sign-up error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('An error occurred during the refresh token process.', cause);
  }
}

/**
 * Error thrown when a confirmation code cannot be resent.
 *
 * This error typically occurs when:
 * - the account is already confirmed,
 * - the account does not exist,
 * - the request is rate-limited,
 * - or the authentication provider fails to process the request.
 */
export class ResendConfirmationCodeError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'RESEND_CONFIRMATION_CODE_ERROR';

  // Constructor

  /**
   * Creates a new {@link ResendConfirmationCodeError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the resend confirmation code failure. This value is intended for
   *   internal use (logging, tracing, diagnostics) and must not be exposed
   *   to clients.
   */
  constructor(cause: ErrorOptions) {
    super('Failed to resend the confirmation code.', cause);
  }
}

/**
 * Error thrown when a sign-in attempt fails due to a non-specific
 * authentication error.
 *
 * This error represents a generic failure during the sign-in process that
 * cannot be attributed to invalid credentials or account state issues.
 *
 * Typical scenarios include:
 * - transient provider failures,
 * - unexpected authentication flow interruptions,
 * - internal errors during credential validation.
 *
 * Security considerations:
 * - This error intentionally avoids exposing internal or provider-specific
 *   details to prevent information leakage.
 * - It should be used as a fallback when a more specific authentication error
 *   is not applicable.
 */
export class SignInError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'SIGN_IN_ERROR';

  // Constructor

  /**
   * Creates a new {@link SignInError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the sign-in error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('An error occurred during sign-in.', cause);
  }
}

/**
 * Error thrown when a sign-up operation fails due to a non-specific
 * authentication error.
 *
 * This error represents a generic failure during the sign-up process that
 * cannot be attributed to more specific conditions such as duplicate users,
 * invalid parameters, or password policy violations.
 *
 * It should be used as a fallback error when no more specialized
 * {@link AuthenticatableError} subtype applies.
 */
export class SignUpError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'SIGN_UP_ERROR';

  // Constructor

  /**
   * Creates a new {@link SignUpError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the sign-up error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('An error occurred during sign-up.', cause);
  }
}

/**
 * Error thrown when an authentication operation is attempted on an
 * account that has not yet been confirmed.
 *
 * This error is typically raised during sign-in or other restricted
 * operations when the account exists but has not completed the
 * required confirmation or verification step.
 */
export class UserIsNotConfirmedError extends AuthenticatableError {
  // Properties

  /**
   * A machine-readable error code identifying the type of authentication error.
   */
  readonly code = 'USER_NOT_CONFIRMED';

  // Constructor

  /**
   * Creates a new {@link UserIsNotConfirmedError} instance.
   *
   * @param cause - The underlying provider error or response that triggered
   *   the user is not confirmed error. This value is intended for internal use
   *   (logging, tracing, diagnostics) and must not be exposed to clients.
   */
  constructor(cause: ErrorOptions) {
    super('The user account is not confirmed.', cause);
  }
}
