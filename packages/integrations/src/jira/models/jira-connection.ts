// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Credential-bearing Jira connection used by {@link JiraClient}.
 *
 * Hosts resolve these from configuration; the connection itself never travels
 * on job payload wires as a secret blob.
 */
export interface JiraConnection {
  /**
   * API token paired with {@link email} for basic auth against Jira Cloud.
   *
   * Must never be logged or included in job results.
   */
  readonly apiToken: string

  /**
   * Jira Cloud base URL (for example `https://example.atlassian.net`).
   */
  readonly baseUrl: string

  /**
   * Atlassian account email used for API basic auth.
   */
  readonly email: string

  /**
   * Stable identifier referenced by triage job payloads.
   */
  readonly id: string

  /**
   * Provider discriminator. Currently only `"jira"` is supported.
   */
  readonly provider: 'jira'
}
