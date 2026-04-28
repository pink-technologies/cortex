// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Represents a normalized authentication token bundle issued after a
 * successful authentication or token refresh operation.
 */
export interface AuthToken {
  /**
   * Short-lived token used to authorize requests to protected resources.
   *
   * This token is expected to be attached to outbound requests (e.g. via an
   * Authorization header) and validated by downstream services.
   */
  accessToken: string;

  /**
   * The exact date and time at which the access token expires (ISO 8601).
   */
  expiresIn: string;

  /**
   * Token containing identity-related claims about the authenticated user.
   *
   * This token is typically used by the application to extract user attributes
   * (e.g. subject, email, roles) and should not be sent to protected APIs unless
   * explicitly required.
   */
  idToken: string;

  /**
   * Long-lived token used to obtain new access and identity tokens without
   * requiring the user to re-authenticate.
   *
   * This token must be handled with the highest level of care and should be
   * stored only in secure storage mechanisms.
   */
  refreshToken: string;
}

/**
 * Represents the normalized payload extracted from an authentication access token.
 *
 * This interface defines the minimal set of claims required by the application
 * layer to identify the authenticated user and reason about token validity.
 *
 * Implementations that decode or validate tokens are responsible for:
 * - mapping provider-specific claims into this normalized shape,
 * - converting time-based claims into proper `Date` instances,
 * - ensuring the payload is only produced from a structurally valid token.
 *
 * This abstraction allows the rest of the system to remain independent of
 * token formats, claim naming conventions, or identity providers.
 */
export interface AuthTokenPayload {
  /**
   * The unique email address associated with the authenticated user.
   *
   * This value is treated as an identity attribute and should already be
   * normalized (e.g. lowercased) by the decoding layer.
   */
  email: string;

  /**
   * The provider-specific username associated with the authenticated user.
   *
   * For Cognito, this maps to the `cognito:username` claim.
   */
  username: string;

  /**
   * The token expiration time (milliseconds since epoch).
   */
  exp: number;
}

/**
 * Represents an authentication credential payload.
 *
 * Use concrete implementations (e.g., username/password, magic link, OAuth)
 * so `Authenticatable.signIn()` can accept multiple credential types without
 * changing its signature.
 */
export abstract class Credential {
  /**
   * The type of credential being used.
   * For example: 'USERNAME_PASSWORD', 'OAUTH_TOKEN', etc.
   * This property helps the authentication provider identify how to process
   * the credential.
   */
  abstract readonly type: string;
}

/**
 * Parameters required to confirm a password reset operation.
 *
 * This type represents the normalized input required by the
 * authentication layer to complete the forgot-password flow.
 *
 * Unlike transport-level DTOs, this type is free of validation
 * decorators and assumes that all values have already been
 * validated and normalized at the API boundary.
 */
export type ConfirmForgotPasswordParameters = {
  /**
   * The account identifier associated with the password reset request.
   *
   * This value is expected to be normalized (e.g. lowercased and trimmed)
   * before being passed to the authentication layer.
   */
  username: string;

  /**
   * The new plaintext password to be set for the account.
   *
   * This value must already satisfy the configured password policy
   * and must never be logged, persisted, or exposed outside of the
   * authentication process.
   */
  newPassword: string;

  /**
   * The confirmation code issued as part of the password recovery flow.
   *
   * This code is typically time-bound and single-use.
   */
  confirmationCode: string;
};

/**
 * Parameters required to confirm a pending user sign-up.
 *
 * This type represents the normalized input required by the
 * authentication layer to complete the sign-up confirmation flow.
 *
 * Unlike transport-level DTOs, this type is free of validation
 * decorators and assumes that all values have already been
 * validated and normalized at the API boundary.
 */
export type ConfirmSignUpParameters = {
  /**
   * The account identifier associated with the account confirmation request.
   *
   * This value is expected to be normalized (e.g. lowercased and trimmed)
   * before being passed to the authentication layer.
   */
  username: string;

  /**
   * The confirmation code issued as part of the signUp flow.
   *
   * This code is typically time-bound and single-use.
   */
  confirmationCode: string;
};

/**
 * Parameters required to refresh authentication tokens.
 *
 * This type represents the normalized input required by the
 * authentication layer to obtain new access and identity tokens
 * using a refresh token.
 *
 * Unlike transport-level DTOs, this type is free of validation
 * decorators and assumes that all values have already been
 * validated and normalized at the API boundary.
 */
export type RefreshTokenParameters = {
  /**
   * The account identifier associated with the refresh token.
   *
   * This value is expected to be normalized (e.g. lowercased and trimmed)
   * before being passed to the authentication layer.
   */
  username: string;

  /**
   * A valid refresh token previously issued during authentication.
   *
   * This value is highly sensitive and must never be logged, persisted,
   * or exposed outside of the authentication process.
   */
  refreshToken: string;
};

/**
 * Parameters required to initiate a user sign-up operation.
 *
 * This type represents the minimal, normalized input required by the
 * authentication layer to create a new user account.
 *
 * Unlike transport-level DTOs, this type is free of validation
 * decorators and assumes that all values have already been
 * validated and normalized at the API boundary.
 */
export type SignupParameters = {
  /**
   * The account identifier to be registered.
   *
   * This value is typically an email address and is expected to be
   * normalized (e.g. lowercased and trimmed) before being passed to
   * the authentication layer.
   */
  username: string;

  /**
   * The plaintext password to be associated with the account.
   *
   * This value must already satisfy the configured password policy
   * and must never be logged, persisted, or exposed outside of the
   * authentication process.
   */
  password: string;
};

/**
 * Username + password credential.
 *
 * Intended for classic login flows where the user provides a username
 * (or email) and a plaintext password that will be validated by the
 * authentication provider.
 */
export class UsernameAndPasswordCredential extends Credential {
  // Properties

  /**
   * The type of credential being used.
   * For example: 'USERNAME_PASSWORD', 'OAUTH_TOKEN', etc.
   * This property helps the authentication provider identify how to process
   * the credential.
   */
  readonly type = 'USERNAME_PASSWORD';

  // Constructor

  /**
   * Creates a new {@link UsernameAndPasswordCredential} instance.
   *
   * @param username - The account identifier (commonly email).
   * @param password - The plaintext password for the account.
   */
  constructor(
    public readonly username: string,
    public readonly password: string,
  ) {
    super();
  }
}

/**
 * Defines the authentication contract exposed by an authentication provider.
 *
 * This interface represents a thin, provider-agnostic boundary used by the
 * application layer to perform common authentication and identity flows.
 *
 * Implementations are responsible for:
 * - translating provider-specific failures into domain or application errors,
 * - preventing leakage of implementation-specific exceptions or details,
 * - ensuring secrets (passwords, tokens, codes) are never logged or persisted,
 * - applying consistent input normalization rules (e.g. username or email casing),
 * - maintaining a stable and uniform token decoding/parsing strategy.
 */
export abstract class Authenticatable {
  /**
   * Confirms a password reset request by validating the confirmation code
   * and setting a new password for the account.
   *
   * This method completes the second step of the forgot-password flow.
   * Upon successful execution, the account password is updated and the
   * reset operation is finalized.
   *
   * This operation assumes that all input values have already been
   * validated and normalized at the transport boundary.
   *
   * @param params - The parameters required to confirm the password reset.
   * @param params.username - The account identifier associated with the reset request.
   * @param params.newPassword - The new plaintext password to be set for the account.
   * @param params.confirmationCode - The confirmation code issued during the password reset flow.
   *
   * @throws ConfirmForgotPasswordError when the confirmation fails due to an
   * invalid or expired confirmation code, an invalid account state, or an
   * underlying provider failure.
   */
  abstract confirmForgotPassword({
    username,
    newPassword,
    confirmationCode,
  }: ConfirmForgotPasswordParameters): Promise<void>;

  /**
   * Confirms a pending user sign-up using a confirmation code.
   *
   * This method completes the sign-up verification step by validating the
   * provided confirmation code for the specified account. Upon successful
   * confirmation, the account transitions into an active/confirmed state.
   *
   * This operation assumes that all input values have already been validated
   * and normalized at the transport boundary.
   *
   * @param params - The parameters required to confirm the sign-up.
   * @param params.username - The account identifier associated with the sign-up request.
   * @param params.confirmationCode - The verification code issued during sign-up.
   *
   * @throws ConfirmSignupError when the confirmation fails due to an invalid or
   * expired code, an invalid account state, or an underlying provider failure.
   */
  abstract confirmSignUp({ username, confirmationCode }: ConfirmSignUpParameters): Promise<void>;

  /**
   * Decodes a JWT token into a normalized token payload.
   *
   * This is typically used for:
   * - extracting claims (sub, roles, scopes),
   * - validating token shape,
   * - normalizing provider-specific claims into a domain payload.
   *
   * @param accessToken - A JWT token string (access or ID token).
   * @returns A normalized payload extracted from the token.
   */
  abstract decode(accessToken: string): Promise<AuthTokenPayload>;

  /**
   * Initiates the password reset flow for a user.
   *
   * Typically triggers the provider to send a confirmation code to the user's
   * delivery channel (email/SMS).
   *
   * @param username - The unique identifier of the account (commonly email).
   */
  abstract forgotPassword(username: string): Promise<void>;

  /**
   * Refreshes authentication tokens using a previously issued refresh token.
   *
   * This method requests a new authentication token bundle without requiring
   * the user to re-authenticate with primary credentials.
   *
   * Upon successful execution, a new {@link AuthToken} instance is returned,
   * containing updated access and identity tokens along with their expiration.
   *
   * This operation assumes that all input values have already been validated
   * and normalized at the transport boundary.
   *
   * @param params - The parameters required to refresh authentication tokens.
   * @param params.username - The account identifier associated with the refresh token.
   * @param params.refreshToken - A valid refresh token previously issued during authentication.
   *
   * @returns A new normalized {@link AuthToken} bundle.
   *
   * @throws RefreshTokenError when the refresh token is expired, revoked,
   * or otherwise invalid, or when an underlying provider failure occurs.
   */
  abstract refreshToken({ username, refreshToken }: RefreshTokenParameters): Promise<AuthToken>;

  /**
   * Resends an account confirmation code to the user.
   *
   * This method triggers the delivery of a new confirmation code
   * associated with the account identifier provided.
   *
   * Typical use cases include:
   * - the original confirmation code expired,
   * - the user did not receive the initial code,
   * - the user requested a new code during the sign-up flow.
   *
   * This operation must not disclose whether the account exists
   * or whether it is already confirmed.
   *
   * @param username - The account identifier associated with the
   * confirmation request (e.g. email).
   *
   * @throws AuthenticatableError when the operation fails due to
   * provider errors, rate limiting, or invalid request state.
   */
  abstract resendConfirmationCode(username: string): Promise<void>;

  /**
   * Signs in a user using a provided credential strategy.
   *
   * This design supports multiple auth methods without changing the interface
   * (e.g., username/password, refresh-based login, OTP, etc.).
   *
   * @param credential - A credential object describing the sign-in method.
   * @returns A token bundle returned by the provider (access/id/refresh tokens).
   */
  abstract signIn(credential: Credential): Promise<AuthToken>;

  /**
   * Initiates a user sign-up operation using the provided credentials.
   *
   * This method creates a new user account in a pending or unconfirmed state,
   * depending on the authentication provider configuration.
   *
   * Upon successful execution, the account is created and any required
   * verification or confirmation flow is initiated.
   *
   * This operation assumes that all input values have already been validated
   * and normalized at the transport boundary.
   *
   * @param params - The parameters required to initiate the sign-up.
   * @param params.username - The account identifier to be registered.
   * @param params.password - The plaintext password for the new account.
   *
   * @throws UserAlreadyExistsError when an account with the given identifier
   * already exists.
   * @throws InvalidPasswordError when the provided password does not meet
   * required security or complexity rules.
   * @throws SignUpError for any other sign-up failure.
   */
  abstract signUp({ username, password }: SignupParameters): Promise<void>;
}
