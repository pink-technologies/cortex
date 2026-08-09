// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Thrown when a Jira user cannot be resolved (for example by email).
 *
 * Raised by {@link JiraUserResource.findByEmail} when the email is blank, no
 * match is found, or the search request fails.
 */
export class JiraUserLookupError extends Error {
  /**
   * Machine-readable code for Jira user lookup failures.
   */
  readonly code = 'JIRA_USER_LOOKUP_ERROR' as const

  /**
   * Email that could not be resolved.
   */
  readonly email: string

  override readonly name = 'JiraUserLookupError'

  /**
   * Creates an error describing a failed Jira user lookup.
   *
   * @param email - Email that was searched.
   * @param options - Standard `Error` options, including `cause`.
   */
  constructor(email: string, options?: ErrorOptions) {
    super(`Failed to look up Jira user for email: ${email}`, options)
    this.email = email
  }
}
