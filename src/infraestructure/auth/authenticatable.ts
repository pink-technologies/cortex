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
 * This abstraction represents a provider-agnostic boundary used by the
 * application layer to execute common authentication and identity flows.
 *
 * Implementations are responsible for encapsulating provider-specific behavior
 * while exposing a consistent and stable interface to the rest of the system.
 *
 * Responsibilities include:
 * - translating provider-specific responses into application-level results,
 * - preventing leakage of implementation details or internal exceptions,
 * - ensuring sensitive data (e.g. passwords, tokens, codes) is never logged or persisted,
 * - applying consistent input normalization (e.g. username or email casing),
 * - maintaining a uniform token structure and parsing strategy.
 */
export abstract class Authenticatable {
  /**
   * Confirms a password reset request and updates the account password.
   *
   * This operation validates the provided confirmation code and, if successful,
   * sets a new password for the specified account, completing the password
   * reset flow.
   *
   * This method assumes that all inputs have already been validated and
   * normalized at the transport or controller layer.
   *
   * @param params - Parameters required to confirm the password reset.
   * @param params.username - Unique account identifier (e.g. email).
   * @param params.newPassword - New plaintext password compliant with the
   * provider's security and complexity requirements.
   * @param params.confirmationCode - Verification code issued during the
   * password reset flow.
   *
   * @returns A promise that resolves when the password has been successfully updated.
   */
  abstract confirmForgotPassword({username, newPassword, confirmationCode}: ConfirmForgotPasswordParameters): Promise<void>;

  /**
   * Confirms a pending user sign-up using a verification code.
   *
   * This operation validates the provided confirmation code for the given
   * account identifier and, if successful, transitions the account into
   * a confirmed/active state.
   *
   * This method assumes that all inputs have already been validated and
   * normalized at the transport or controller layer.
   *
   * @param params - Parameters required to confirm the sign-up.
   * @param params.username - Unique account identifier (e.g. email).
   * @param params.confirmationCode - Verification code issued during sign-up.
   *
   * @returns A promise that resolves when the account has been successfully confirmed.
   */
  abstract confirmSignUp({username, confirmationCode}: ConfirmSignUpParameters): Promise<void>;

  /**
   * Decodes a JWT token into a normalized token payload.
   *
   * This is typically used for:
   * - extracting claims (sub, roles, scopes),
   * - validating token shape,
   * - normalizing provider-specific claims into a domain payload.
   *
   * @param idToken - A JWT token string (ID token).
   * @returns A normalized payload extracted from the token.
   */
  abstract decode(idToken: string): Promise<AuthTokenPayload>;

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
   * Refreshes authentication tokens using a valid refresh token.
   *
   * This operation requests a new authentication token bundle without requiring
   * the user to re-authenticate with primary credentials.
   *
   * If successful, a new {@link AuthToken} is returned containing updated
   * access and identity tokens along with their expiration metadata.
   *
   * This method assumes that all inputs have already been validated and
   * normalized at the transport or controller layer.
   *
   * @param params - Parameters required to refresh authentication tokens.
   * @param params.username - Unique account identifier associated with the token.
   * @param params.refreshToken - Previously issued refresh token.
   *
   * @returns A promise that resolves with a new {@link AuthToken} bundle.
   */
  abstract refreshToken({username, refreshToken}: RefreshTokenParameters): Promise<AuthToken>;

  /**
   * Requests a new confirmation code for a user account.
   *
   * This operation triggers the delivery of a new confirmation code
   * associated with the provided account identifier (e.g. email or phone),
   * typically used during the sign-up confirmation flow.
   *
   * Common scenarios include expired codes, delivery issues,
   * or explicit user requests to resend the code.
   *
   * Implementations must ensure that this operation does not reveal
   * whether the account exists or its current confirmation status.
   *
   * This method assumes that all inputs have already been validated
   * and normalized at the transport or controller layer.
   *
   * @param username - Unique account identifier (e.g. email).
   *
   * @returns A promise that resolves when the request has been processed.
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
   * Registers a new user account with the authentication provider.
   *
   * This operation creates a user in an unconfirmed or pending state,
   * depending on the provider configuration (e.g. email or phone verification).
   *
   * If the registration succeeds, a unique identifier (`cognitoSub`) is returned.
   * This identifier represents the user in the identity provider and should be
   * persisted in your system for future reference.
   *
   * This method assumes that all inputs have already been validated and
   * normalized at the transport or controller layer.
   *
   * @param params - Sign-up parameters.
   * @param params.username - Unique identifier for the user (e.g. email).
   * @param params.password - Plaintext password compliant with the provider's
   * security and complexity requirements.
   *
   * @returns A promise that resolves with the authentication provider user ID.
   * @returns.cognitoSub - Unique identifier assigned by the identity provider.
   */
  abstract signUp({username, password}: SignupParameters): Promise<{ cognitoSub: string }>;
}
