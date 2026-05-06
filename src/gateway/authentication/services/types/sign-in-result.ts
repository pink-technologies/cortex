// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AuthToken } from '@/infraestructure/auth';
import { User } from '@/infraestructure/database';

/**
 * Result returned after a successful sign-in operation.
 *
 * This type represents the aggregated outcome of authentication,
 * combining the issued authentication token bundle with the
 * corresponding application-level user entity.
 *
 * This abstraction allows the application layer to reason about
 * authentication and user context together, without coupling
 * consumers to provider-specific details.
 */
export type SignInResult = {
  /**
   * The normalized authentication token bundle issued for the session.
   *
   * This token contains the credentials required to authorize
   * subsequent requests and manage token refresh.
   */
  token: AuthToken;

  /**
   * The application-level user associated with the authenticated session.
   *
   * This entity represents the persisted user record stored in the
   * application database and should be treated as the source of truth
   * for user-related data.
   */
  user: User;
};
