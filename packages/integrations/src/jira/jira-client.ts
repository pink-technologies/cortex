// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Session, type RequestBuilderOptions } from '@cortex/networking'
import type { JiraConnection } from './models'

/**
 * Options accepted by {@link JiraClient.request}.
 *
 * Auth and base URL come from the client’s {@link JiraConnection}; callers only
 * supply a relative path plus method, parameters, and signal.
 */
export type JiraRequestOptions = Omit<RequestBuilderOptions, 'headers'>

/**
 * Authenticated HTTP client for a single {@link JiraConnection}.
 *
 * Owns the site base URL, Basic auth headers, and shared {@link Session}.
 * Resources such as {@link JiraIssueResource} and {@link JiraCommentResource}
 * are constructed with a client instance and call {@link request} with relative
 * API paths only. Networking {@link Request} details stay inside this type.
 */
export class JiraClient {
  // MARK: - Properties

  private readonly connection: JiraConnection
  private readonly session = new Session()

  // MARK: - Constructor

  /**
   * Creates a client bound to one Jira site connection.
   *
   * @param connection - Site base URL and Basic auth credentials.
   */
  constructor(connection: JiraConnection) {
    this.connection = connection
  }

  // MARK: - Instance methods

  /**
   * Executes a request against a path under the connection base URL and decodes JSON.
   *
   * `path` must be absolute from the site root (for example
   * `/rest/api/3/issue/JC-1`). Leading slashes are normalized; auth headers are
   * applied by the client. Responses are validated, then deserialized as `T`.
   *
   * @typeParam T - Expected JSON response shape.
   * @param path - Relative Jira REST path to execute.
   * @param options - Method, parameters, encoder, body, and abort signal.
   * @returns Decoded JSON body as `T`.
   * @throws When validation or JSON deserialization fails.
   */
  async request<T>(path: string, options: JiraRequestOptions = {}): Promise<T> {
    const baseUrl = this.connection.baseUrl.replace(/\/+$/, '')
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const token = Buffer.from(`${this.connection.email}:${this.connection.apiToken}`).toString('base64')

    const response = await this.session
      .request(`${baseUrl}${normalizedPath}`, {
        ...options,
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${token}`,
        },
      })
      .validate()
      .serializingJson<T>()

    if (!response.result.ok) {
      throw response.result.error
    }

    return response.result.value
  }
}
