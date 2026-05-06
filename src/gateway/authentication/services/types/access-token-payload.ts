// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Normalized payload returned after decoding an access or ID token.
 */
export type AccessTokenPayload = {
  /**
   * Token expiration timestamp (ISO 8601).
   */
  expiresIn: string;

  /**
   * Username representation used by the application (email).
   */
  username: string;
};
