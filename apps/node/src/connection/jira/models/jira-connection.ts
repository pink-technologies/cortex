// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Credential-bearing Jira connection configured on the Node.
 *
 * Referenced by job payloads through {@link JiraConnection.id}. The connection
 * itself never travels on the wire.
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

/**
 * Resolves Node-local Jira connections by identifier.
 */
export interface JiraConnectionStore {
  /**
   * Resolves a configured connection.
   *
   * @param connectionId - Identifier from the job payload.
   * @returns The matching connection.
   * @throws When no connection is configured for the identifier.
   */
  resolve(connectionId: string): JiraConnection
}
