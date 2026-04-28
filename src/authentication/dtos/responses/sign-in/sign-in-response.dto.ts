// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AuthToken } from '@/infraestructure/auth';
import { User } from '@/infraestructure/database';

/**
 * Data Transfer Object representing the response returned after a
 * successful sign-in operation.
 *
 * This DTO aggregates the authenticated user profile and the
 * issued authentication token bundle into a single response
 * returned to the client.
 */
export class SignInResponseDto {
  // Constructor

  /**
   * Creates a new {@link SignInResponseDto}.
   *
   * @param user - The authenticated user's public profile data.
   * @param token - The authentication token bundle issued for the session.
   */
  constructor(
    readonly user: UserResponseDto,
    readonly token: AuthenticationTokenResponseDto,
  ) { }
}

/**
 * Data Transfer Object representing authentication tokens returned
 * to the client.
 *
 * This DTO exposes a read-only, normalized view of authentication
 * tokens derived from the domain-level {@link AuthToken}.
 */
export class AuthenticationTokenResponseDto {
  /**
   * Short-lived token used to authorize requests to protected resources.
   */
  readonly accessToken: string;

  /**
   * The exact date and time at which the access token expires (ISO 8601).
   */
  readonly expiresIn: string;

  /**
   * Token containing identity-related claims about the authenticated user.
   */
  readonly idToken: string;

  /**
   * Long-lived token used to obtain new access tokens without
   * re-authenticating the user.
   */
  readonly refreshToken: string;

  // Static methods

  /**
   * Creates an {@link AuthenticationTokenResponseDto} from a domain-level
   * {@link AuthToken}.
   *
   * This method serves as a mapping boundary between the domain model
   * and the API response layer.
   *
   * @param authToken - The domain authentication token bundle.
   * @returns A response DTO suitable for API responses.
   */
  static from(authToken: AuthToken): AuthenticationTokenResponseDto {
    return {
      accessToken: authToken.accessToken,
      expiresIn: authToken.expiresIn,
      idToken: authToken.idToken,
      refreshToken: authToken.refreshToken,
    };
  }
}

/**
 * Data Transfer Object representing a user profile returned to the client.
 *
 * This DTO exposes a read-only, sanitized view of the application-level
 * user entity suitable for API responses.
 */
export class UserResponseDto {
  /**
   * Unique identifier of the user.
   */
  readonly id: string;

  /**
   * Email address associated with the user account.
   */
  readonly email: string;

  /**
   * The user's given (first) name.
   */
  readonly firstName: string;

  /**
   * The user's family (last) name.
   */
  readonly lastName: string;

  // Static methods

  /**
   * Creates a {@link UserResponseDto} from a domain-level {@link User}.
   *
   * This method acts as a mapping boundary between the domain
   * entity and the API response layer.
   *
   * @param user - The domain user entity.
   * @returns A response DTO suitable for API responses.
   */
  static from(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
