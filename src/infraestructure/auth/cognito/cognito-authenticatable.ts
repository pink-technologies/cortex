// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ErrorMapper } from './error-mapper';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import {
  ChallengeRequiredError,
  ConfirmForgotPasswordError,
  ConfirmSignupError,
  DecodeTokenError,
  ForgotPasswordError,
  RefreshTokenError,
  ResendConfirmationCodeError,
  SignInError,
  SignUpError,
} from '../error/authenticatable-error';

import {
  AuthenticationResultType,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  InitiateAuthCommandOutput,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import {
  Authenticatable,
  AuthToken,
  AuthTokenPayload,
  Credential,
  ConfirmForgotPasswordParameters,
  ConfirmSignUpParameters,
  RefreshTokenParameters,
  SignupParameters,
  UsernameAndPasswordCredential,
} from '../authenticatable';

/**
 * Configuration options required to initialize the authentication client.
 *
 * This type defines all values needed to configure communication with
 * the underlying authentication provider and related verification
 * mechanisms.
 *
 * All values are expected to be supplied by the application
 * configuration layer (e.g. environment variables or a config service)
 * and must not be hardcoded.
 */
export type CognitoOptions = {
  /**
   * The identifier of the authentication client.
   */
  clientId: string;

  /**
   * The identifier of the user pool associated with the client.
   */
  clientPoolId: string;

  /**
   * The secret associated with the authentication client.
   *
   * This value must be treated as sensitive and must never be logged,
   * persisted, or exposed to clients.
   */
  clientSecret: string;

  /**
   * The region where the authentication service is hosted.
   */
  region: string;
};

/**
 * A client that facilitates user authentication with Amazon Cognito.
 *
 * It provides methods for user sign-in, sign-up, password recovery,
 * token refresh, and token decoding.
 *
 * This client acts as a concrete implementation of the {@link Authenticatable}
 * contract and serves as an infrastructure-layer adapter, translating
 * provider-specific authentication operations into normalized
 * application-level abstractions.
 */
@Injectable()
export class CognitoAuthenticatable implements Authenticatable {
  // Private Properties

  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly cognitoUri: string;
  private readonly jwksClient: JwksClient;

  // MARK: - Constructor

  /**
   * Creates a new authentication provider client.
   *
   * This constructor initializes all required dependencies to interact
   * with the authentication provider, including:
   * - the provider SDK client used to perform authentication operations,
   * - the JWKS client used to resolve public keys for token verification,
   * - provider-specific endpoint configuration derived from the supplied options.
   *
   * All configuration values are expected to be supplied by the application
   * configuration layer and must not be hardcoded.
   *
   * @param options - Configuration options required to initialize the
   * authentication provider client.
   *
   * @param options.clientId - The identifier of the authentication client.
   * @param options.clientPoolId - The identifier of the user pool associated
   * with the client.
   * @param options.clientSecret - The secret associated with the authentication
   * client. This value must be treated as sensitive and must never be logged,
   * persisted, or exposed.
   * @param options.region - The region where the authentication service
   * is hosted.
   *
   * App client id/secret apply only to Cognito API fields and SECRET_HASH; SDK
   * calls use the default AWS credential chain (runtime IAM role or env/profile
   * locally). That principal needs cognito-idp permissions on this pool.
   */
  constructor(private readonly options: CognitoOptions) {
    this.cognitoUri = `https://cognito-idp.${options.region}.amazonaws.com/${options.clientPoolId}`;
    this.jwksClient = new JwksClient({ jwksUri: `${this.cognitoUri}/.well-known/jwks.json` });
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: options.region,
    });
  }

  // MARK: - Authenticatable

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
  async confirmForgotPassword({
    username,
    newPassword,
    confirmationCode,
  }: ConfirmForgotPasswordParameters): Promise<void> {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.options.clientId,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
        Username: username,
        SecretHash: this.hashForUsername(username),
      });

      await this.cognitoClient.send(command);
    } catch (exception) {
      throw ErrorMapper.map({
        error: exception,
        fallback: new ConfirmForgotPasswordError(exception),
      });
    }
  }

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
  async confirmSignUp({ username, confirmationCode }: ConfirmSignUpParameters): Promise<void> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.options.clientId,
        ConfirmationCode: confirmationCode,
        Username: username,
        SecretHash: this.hashForUsername(username),
      });

      await this.cognitoClient.send(command);
    } catch (exception) {
      throw ErrorMapper.map({ error: exception, fallback: new ConfirmSignupError(exception) });
    }
  }

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
  async decode(idToken: string): Promise<AuthTokenPayload> {
    try {
      const decodedHeader = jwt.decode(idToken, { complete: true }) as {
        header?: { kid?: string };
      } | null;

      const kid = decodedHeader?.header?.kid;
      if (!kid) {
        throw new DecodeTokenError(new Error('Token header is missing the key id (kid).' as string));
      }

      const key = await this.jwksClient.getSigningKey(kid);
      const decodedToken = jwt.verify(idToken, key.getPublicKey(), {
        algorithms: ['RS256'],
        issuer: this.cognitoUri,
      }) as JwtPayload;

      return {
        email: decodedToken.email,
        username: decodedToken['cognito:username'] ?? decodedToken.username ?? decodedToken.sub,
        exp: (decodedToken.exp ?? 0) * 1000,
      };
    } catch (exception) {
      throw ErrorMapper.map({ error: exception, fallback: new DecodeTokenError(exception) });
    }
  }

  /**
   * Initiates the password reset flow for a user.
   *
   * Typically triggers the provider to send a confirmation code to the user's
   * delivery channel (email/SMS).
   *
   * @param username - The unique identifier of the account (commonly email).
   */
  async forgotPassword(username: string): Promise<void> {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.options.clientId,
        Username: username,
        SecretHash: this.hashForUsername(username),
      });

      await this.cognitoClient.send(command);
    } catch (exception) {
      throw ErrorMapper.map({ error: exception, fallback: new ForgotPasswordError(exception) });
    }
  }

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
  async refreshToken({ username, refreshToken }: RefreshTokenParameters): Promise<AuthToken> {
    var response: InitiateAuthCommandOutput;

    try {
      const parameters: Record<string, string> = {
        REFRESH_TOKEN: refreshToken,
        USERNAME: username,
      };

      parameters.SECRET_HASH = this.hashForUsername(username);

      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: parameters,
        ClientId: this.options.clientId,
      });

      response = await this.cognitoClient.send(command);
    } catch (exception) {
      throw ErrorMapper.map({ error: exception, fallback: new RefreshTokenError(exception) });
    }

    if (response.AuthenticationResult && this.isValid(response.AuthenticationResult)) {
      const expiresInSeconds = response.AuthenticationResult!.ExpiresIn!;
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

      return {
        accessToken: response.AuthenticationResult!.AccessToken!,
        expiresIn: expiresAt,
        idToken: response.AuthenticationResult!.IdToken!,
        refreshToken: refreshToken,
      };
    }

    throw new RefreshTokenError(new Error('Token refresh failed: invalid response from provider.'));
  }

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
  async resendConfirmationCode(username: string): Promise<void> {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.options.clientId,
        Username: username,
        SecretHash: this.hashForUsername(username),
      });

      await this.cognitoClient.send(command);
    } catch (exception) {
      throw ErrorMapper.map({
        error: exception,
        fallback: new ResendConfirmationCodeError(exception),
      });
    }
  }

  /**
   * Signs in a user using a provided credential strategy.
   *
   * This design supports multiple auth methods without changing the interface
   * (e.g., username/password, refresh-based login, OTP, etc.).
   *
   * @param credential - A credential object describing the sign-in method.
   * @returns A token bundle returned by the provider (access/id/refresh tokens).
   */
  async signIn(credential: Credential): Promise<AuthToken> {
    if (credential instanceof UsernameAndPasswordCredential) {
      var response: InitiateAuthCommandOutput;

      try {
        const command = new InitiateAuthCommand({
          ClientId: this.options.clientId,
          AuthFlow: 'USER_PASSWORD_AUTH',
          AuthParameters: {
            USERNAME: credential.username,
            PASSWORD: credential.password,
            SECRET_HASH: this.hashForUsername(credential.username),
          },
        });

        response = await this.cognitoClient.send(command);
      } catch (exception) {
        throw ErrorMapper.map({ error: exception, fallback: new SignInError(exception) });
      }

      if (response.ChallengeName && response.Session) {
        throw new ChallengeRequiredError(response.ChallengeName!, response.Session!);
      }

      if (response.AuthenticationResult && this.isValid(response.AuthenticationResult)) {
        const expiresInSeconds = response.AuthenticationResult!.ExpiresIn!;
        const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

        return {
          accessToken: response.AuthenticationResult!.AccessToken!,
          expiresIn: expiresAt,
          idToken: response.AuthenticationResult!.IdToken!,
          refreshToken: response.AuthenticationResult!.RefreshToken!,
        };
      }

      throw new SignInError(new Error('Authentication failed: invalid response from provider.'));
    }

    throw new SignInError(new Error('Authentication failed: unsupported credential.'));
  }

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
  async signUp({ username, password }: SignupParameters): Promise<void> {
    try {
      const command = new SignUpCommand({
        ClientId: this.options.clientId,
        Username: username,
        Password: password,
        SecretHash: this.hashForUsername(username),
      });

      await this.cognitoClient.send(command);
    } catch (exception) {
      throw ErrorMapper.map({ error: exception, fallback: new SignUpError(exception) });
    }
  }

  // Private methods

  private hashForUsername(username: string): string {
    return crypto
      .createHmac('sha256', this.options.clientSecret)
      .update(username + this.options.clientId)
      .digest('base64');
  }

  private isValid(result: AuthenticationResultType): boolean {
    return !!(result.AccessToken && result.IdToken && result.ExpiresIn);
  }
}
