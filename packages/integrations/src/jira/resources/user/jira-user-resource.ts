// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod } from '@cortex/networking'
import type { JiraClient } from '../../jira-client'
import { JiraUserLookupError } from './error/error'
import type { JiraUser } from './models'
import type { JiraUserSearchResponse } from './models'

/**
 * Jira Cloud resource for user search (`/rest/api/3/user/search`).
 *
 * Resolves project-lead emails to account ids for mentions and reassignment.
 */
export class JiraUserResource {
  // MARK: - Properties

  private readonly client: JiraClient

  // MARK: - Constructor

  /**
   * Creates a user resource bound to a Jira client.
   *
   * @param client - Authenticated client for the target Jira site.
   */
  constructor(client: JiraClient) {
    this.client = client
  }

  // MARK: - Instance methods

  /**
   * Finds a user by email via `GET /rest/api/3/user/search`.
   *
   * Prefers an exact `emailAddress` match when Jira returns emails; otherwise
   * uses the first search hit for the query.
   *
   * @param email - Lead email from project configuration.
   * @param signal - Aborts the in-flight request when triggered.
   * @returns Resolved user.
   * @throws {@link JiraUserLookupError} when `email` is blank, no match is
   *   found, or the search request fails.
   */
  async findByEmail(email: string, signal: AbortSignal): Promise<JiraUser> {
    signal.throwIfAborted()

    const normalized = email.trim().toLowerCase()

    if (!normalized) {
      throw new JiraUserLookupError(email)
    }

    try {
      const users = await this.client.request<JiraUserSearchResponse[]>(
        `/rest/api/3/user/search?query=${encodeURIComponent(normalized)}`,
        {
          method: HTTPMethod.GET,
          signal,
        },
      )

      const exact = users.find((user) => user.emailAddress?.trim().toLowerCase() === normalized)
      const candidate = exact ?? users[0]

      if (!candidate?.accountId) {
        throw new Error(`No Jira user found for email: ${email}`)
      }

      return {
        accountId: candidate.accountId,
        displayName: candidate.displayName?.trim() || email.trim(),
        emailAddress: candidate.emailAddress,
      }
    } catch (error) {
      if (signal.aborted) {
        throw error
      }

      throw new JiraUserLookupError(email, { cause: error })
    }
  }
}
