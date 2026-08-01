// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { GitHubPullRequestResponse } from './github-pull-request-response'

/**
 * Pull-request fields needed by repository review and triage.
 *
 * Domain model mapped from GitHub REST payloads. Wire shapes stay in
 * {@link GitHubPullRequestResponse}; use {@link GitHubPullRequest.from} to
 * convert them.
 */
export class GitHubPullRequest {
  // MARK: - Properties

  /**
   * Optional body of the pull request.
   */
  readonly body?: string

  /**
   * Head branch name when available.
   */
  readonly headRef?: string

  /**
   * Pull-request number within the repository.
   */
  readonly number: number

  /**
   * Pull-request title.
   */
  readonly title: string

  /**
   * HTML URL of the pull request when available.
   */
  readonly url?: string

  // MARK: - Static methods

  /**
   * Maps a transport-layer pull-request response into a domain pull request.
   *
   * @param response - Decoded payload from a pulls endpoint.
   * @returns Domain pull request ready for handlers.
   */
  static from(response: GitHubPullRequestResponse): GitHubPullRequest {
    return new GitHubPullRequest(
      response.body ?? undefined,
      response.head?.ref,
      response.number,
      response.title,
      response.html_url,
    )
  }

  // MARK: - Constructor

  /**
   * Creates a domain GitHub pull request.
   *
   * @param body - Optional body of the pull request.
   * @param headRef - Head branch name when available.
   * @param number - Pull-request number within the repository.
   * @param title - Pull-request title.
   * @param url - HTML URL of the pull request when available.
   */
  constructor(body: string | undefined, headRef: string | undefined, number: number, title: string, url: string | undefined) {
    this.body = body
    this.headRef = headRef
    this.number = number
    this.title = title
    this.url = url
  }
}
