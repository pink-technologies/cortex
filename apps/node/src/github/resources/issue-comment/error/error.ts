// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NodeApplicationError } from '../../../../error/error'

/**
 * Thrown when a GitHub issue comment cannot be created.
 *
 * Raised by {@link GitHubIssueCommentResource.create} when the comment request
 * fails. The underlying networking failure is preserved in {@link Error.cause}.
 */
export class GitHubIssueCommentCreateError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for GitHub issue-comment create failures.
   */
  readonly code = 'GITHUB_ISSUE_COMMENT_CREATE_ERROR'

  /**
   * Issue or pull-request number that could not receive the comment.
   */
  readonly issueNumber: number

  /**
   * Repository owner.
   */
  readonly owner: string

  /**
   * Repository name.
   */
  readonly repository: string

  // MARK: - Constructor

  /**
   * Creates an error describing a failed GitHub issue-comment create.
   *
   * @param owner - Repository owner.
   * @param repository - Repository name.
   * @param issueNumber - Issue or pull-request number targeted by the comment.
   * @param options - Optional error details, including the original cause.
   */
  constructor(owner: string, repository: string, issueNumber: number, options?: ErrorOptions) {
    super(`Failed to create GitHub issue comment on ${owner}/${repository}#${issueNumber}`, options)

    this.issueNumber = issueNumber
    this.owner = owner
    this.repository = repository
  }
}
