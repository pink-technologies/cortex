// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsDefined } from 'class-validator';

/**
 * Data Transfer Object representing the parameters required to
 * refresh an authentication session.
 *
 * This DTO is used when a client exchanges a refresh token for a
 * new access token and related session metadata.
 *
 * Validation is intentionally strict to:
 * - ensure the refresh token and ID token are present,
 * - prevent malformed input from reaching the authentication layer.
 */
export class RefreshTokenParametersDto {
  /**
   * A valid ID token issued during the authentication process.
   *
   * This token is decoded to extract the provider username required
   * to refresh the session with Cognito.
   */
  @IsDefined({ message: 'ID token is required.' })
  idToken: string;

  /**
   * The refresh token issued to the client during authentication.
   *
   * This token is used to validate the session refresh request and is
   * typically time-bound and revocable.
   */
  @IsDefined({ message: 'Refresh token is required.' })
  refreshToken: string;
}
