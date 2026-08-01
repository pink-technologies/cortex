// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod, JSONParameterEncoder } from '@cortex/networking'
import type { GitHubClient } from '../../github-client'
import { GitHubIssueCommentCreateError } from './error/error'

/**
 * GitHub REST resource for the `/repos/{owner}/{repo}/issues/{n}/comments` path.
 *
 * Posts comments on issues and pull requests (GitHub uses the issues comments
 * API for PR discussion). Transport and auth are provided by the injected
 * {@link GitHubClient}.
 */
export class GitHubIssueCommentResource {
  // MARK: - Properties

  private readonly client: GitHubClient

  // MARK: - Constructor

  /**
   * Creates an issue-comment resource bound to a GitHub client.
   *
   * @param client - Authenticated client for the target GitHub API.
   */
  constructor(client: GitHubClient) {
    this.client = client
  }

  // MARK: - Instance methods

  /**
   * Creates a comment via `POST /repos/{owner}/{repo}/issues/{issue_number}/comments`.
   *
   * @param owner - Repository owner or organization.
   * @param repository - Repository name.
   * @param issueNumber - Issue or pull-request number that receives the comment.
   * @param body - Markdown or plain-text comment content.
   * @param signal - Aborts the in-flight request when triggered.
   * @throws {@link GitHubIssueCommentCreateError} when the comment create fails.
   */
  async create(
    owner: string,
    repository: string,
    issueNumber: number,
    body: string,
    signal: AbortSignal,
  ): Promise<void> {
    signal.throwIfAborted()

    try {
      await this.client.request(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}/comments`,
        {
          method: HTTPMethod.POST,
          parameterEncoder: JSONParameterEncoder.default,
          parameters: { body },
          signal,
        },
      )
    } catch (error) {
      if (signal.aborted) {
        throw error
      }

      throw new GitHubIssueCommentCreateError(owner, repository, issueNumber, { cause: error })
    }
  }
}
