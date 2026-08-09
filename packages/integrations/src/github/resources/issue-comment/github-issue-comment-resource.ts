// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod, JSONParameterEncoder } from '@cortex/networking'
import type { GitHubClient } from '../../github-client'
import { GitHubIssueCommentCreateError } from './error/error'
import { GitHubCreateCommentParameters } from './parameters'

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
   * @param parameters - Target repository, issue/PR number, and comment body.
   * @param signal - Aborts the in-flight request when triggered.
   * @throws {@link GitHubIssueCommentCreateError} when the comment create fails.
   */
  async create(parameters: GitHubCreateCommentParameters, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted()

    try {
      await this.client.request(
        `/repos/${encodeURIComponent(parameters.owner)}/${encodeURIComponent(parameters.repository)}/issues/${parameters.issueNumber}/comments`,
        {
          method: HTTPMethod.POST,
          parameterEncoder: JSONParameterEncoder.default,
          parameters: { body: parameters.body },
          signal,
        },
      )
    } catch (error) {
      if (signal.aborted) {
        throw error
      }

      throw new GitHubIssueCommentCreateError(
        parameters.owner, 
        parameters.repository, 
        parameters.issueNumber, 
        {
          cause: error,
        },
      )
    }
  }
}
