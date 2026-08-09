// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Minimal Jira user identity used for mentions and reassignment.
 */
export type JiraUser = {
  /**
   * Atlassian account id.
   */
  readonly accountId: string

  /**
   * Human-readable display name from Jira.
   */
  readonly displayName: string

  /**
   * Email when the site returns it (often redacted).
   */
  readonly emailAddress?: string
}
