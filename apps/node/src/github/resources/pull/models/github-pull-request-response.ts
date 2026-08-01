// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Pull-request payload as returned by GitHub REST
 * `GET /repos/{owner}/{repo}/pulls/{pull_number}` and create endpoints.
 */
export interface GitHubPullRequestResponse {
  /**
   * Pull-request body markdown, or `null` when empty.
   */
  readonly body?: string | null

  /**
   * Head branch tip metadata.
   */
  readonly head?: GitHubPullRequestResponseHead

  /**
   * HTML URL of the pull request on github.com (or enterprise host).
   *
   * Wire name: `html_url`.
   */
  readonly html_url?: string

  /**
   * Pull-request number within the repository.
   */
  readonly number: number

  /**
   * Pull-request title.
   */
  readonly title: string
}

/**
 * Nested `head` object on a GitHub pull-request response.
 */
export interface GitHubPullRequestResponseHead {
  /**
   * Head branch name when available.
   */
  readonly ref?: string
}
