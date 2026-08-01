// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Supported source-control providers for Node-local connections.
 */
export type SourceControlProvider = 'github'

/**
 * Credential-bearing source-control connection configured on the Node.
 *
 * Referenced by job payloads through {@link SourceControlConnection.id}. The
 * connection itself never travels on the wire.
 */
export interface SourceControlConnection {
  /**
   * Optional API base URL. Defaults to `https://api.github.com` for GitHub.
   */
  readonly apiBaseUrl?: string

  /**
   * Stable identifier referenced by review job payloads.
   */
  readonly id: string

  /**
   * Source-control provider this connection authenticates against.
   */
  readonly provider: SourceControlProvider

  /**
   * Authentication token used for clone and API calls.
   *
   * Must never be logged or included in job results.
   */
  readonly token: string
}

/**
 * Resolves Node-local source-control connections by identifier.
 */
export interface SourceControlConnectionStore {
  /**
   * Resolves a configured connection.
   *
   * @param connectionId - Identifier from the job payload.
   * @returns The matching connection.
   * @throws When no connection is configured for the identifier.
   */
  resolve(connectionId: string): SourceControlConnection
}
