// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Credential-bearing GitHub connection used by {@link GitHubClient}.
 *
 * Hosts may carry additional fields (for example a connection id); only
 * {@link token} and optional {@link apiBaseUrl} are required for HTTP.
 */
export interface GitHubConnection {
  /**
   * Optional API base URL. Defaults to `https://api.github.com`.
   */
  readonly apiBaseUrl?: string

  /**
   * Authentication token used for API calls.
   *
   * Must never be logged or included in job results.
   */
  readonly token: string
}
