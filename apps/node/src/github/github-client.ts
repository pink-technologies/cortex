// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Session, type RequestBuilderOptions } from '@cortex/networking'
import type { SourceControlConnection } from '../connection'

/**
 * Options accepted by {@link GitHubClient.request}.
 *
 * Auth and base URL come from the client’s {@link SourceControlConnection};
 * callers only supply a relative path plus method, parameters, and signal.
 */
export type GitHubRequestOptions = Omit<RequestBuilderOptions, 'headers'>

/**
 * Authenticated HTTP client for a single GitHub {@link SourceControlConnection}.
 *
 * Owns the API base URL, Bearer auth headers, and shared {@link Session}.
 * Resources such as {@link GitHubPullResource} and
 * {@link GitHubIssueCommentResource} are constructed with a client instance
 * and call {@link request} with relative API paths only. Networking
 * {@link Request} details stay inside this type.
 */
export class GitHubClient {
  // MARK: - Properties

  private readonly connection: SourceControlConnection
  private readonly session = new Session()

  // MARK: - Constructor

  /**
   * Creates a client bound to one GitHub connection.
   *
   * @param connection - API base URL override and Bearer token.
   */
  constructor(connection: SourceControlConnection) {
    this.connection = connection
  }

  // MARK: - Instance methods

  /**
   * Executes a request against a path under the GitHub API base URL and decodes JSON.
   *
   * `path` must be absolute from the API root (for example
   * `/repos/acme/app/pulls/1`). Leading slashes are normalized; auth headers are
   * applied by the client. Responses are validated, then deserialized as `T`.
   *
   * @typeParam T - Expected JSON response shape.
   * @param path - Relative GitHub REST path to execute.
   * @param options - Method, parameters, encoder, body, and abort signal.
   * @returns Decoded JSON body as `T`.
   * @throws When validation or JSON deserialization fails.
   */
  async request<T>(path: string, options: GitHubRequestOptions = {}): Promise<T> {
    const baseUrl = (this.connection.apiBaseUrl ?? 'https://api.github.com').replace(/\/+$/, '')
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const response = await this.session
      .request(`${baseUrl}${normalizedPath}`, {
        ...options,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.connection.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
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
