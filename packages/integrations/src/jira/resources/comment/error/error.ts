// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IntegrationsError } from '../../../../error/error'

/**
 * Thrown when a comment cannot be added to a Jira issue.
 *
 * Raised by {@link JiraCommentResource.create} when the comment request fails.
 * The underlying networking failure is preserved in {@link Error.cause}.
 */
export class JiraAddCommentError extends IntegrationsError {
  // MARK: - Properties

  /**
   * Machine-readable code for Jira add-comment failures.
   */
  readonly code = 'JIRA_ADD_COMMENT_ERROR'

  /**
   * Issue key that could not receive the comment.
   */
  readonly issueKey: string

  // MARK: - Constructor

  /**
   * Creates an error describing a failed Jira comment create.
   *
   * @param issueKey - Issue key targeted by the comment.
   * @param options - Optional error details, including the original cause.
   */
  constructor(issueKey: string, options?: ErrorOptions) {
    super(`Failed to add comment to Jira issue: ${issueKey}`, options)

    this.issueKey = issueKey
  }
}
