// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IntegrationsError } from '../../../../error/error'

/**
 * Thrown when a Jira issue cannot be loaded.
 *
 * Raised by {@link JiraIssueResource.get} when the issue request fails validation
 * or transport. The underlying networking failure is preserved in
 * {@link Error.cause}.
 */
export class JiraIssueLookupError extends IntegrationsError {
  // MARK: - Properties

  /**
   * Machine-readable code for Jira issue lookup failures.
   */
  readonly code = 'JIRA_ISSUE_LOOKUP_ERROR'

  /**
   * Issue key that could not be loaded.
   */
  readonly issueKey: string

  // MARK: - Constructor

  /**
   * Creates an error describing a failed Jira issue lookup.
   *
   * @param issueKey - Issue key requested from Jira.
   * @param options - Optional error details, including the original cause.
   */
  constructor(issueKey: string, options?: ErrorOptions) {
    super(`Failed to look up Jira issue: ${issueKey}`, options)

    this.issueKey = issueKey
  }
}

/**
 * Thrown when a Jira issue cannot be reassigned.
 *
 * Raised by {@link JiraIssueResource.assign} when the assignee update fails.
 * The underlying networking failure is preserved in {@link Error.cause}.
 */
export class JiraAssignIssueError extends IntegrationsError {
  // MARK: - Properties

  /**
   * Machine-readable code for Jira assign-issue failures.
   */
  readonly code = 'JIRA_ASSIGN_ISSUE_ERROR'

  /**
   * Assignee account id that was requested.
   */
  readonly accountId: string

  /**
   * Issue key that could not be reassigned.
   */
  readonly issueKey: string

  // MARK: - Constructor

  /**
   * Creates an error describing a failed Jira issue assignment.
   *
   * @param issueKey - Issue key targeted by the assignment.
   * @param accountId - Assignee account id that was requested.
   * @param options - Optional error details, including the original cause.
   */
  constructor(issueKey: string, accountId: string, options?: ErrorOptions) {
    super(`Failed to assign Jira issue ${issueKey} to ${accountId}`, options)

    this.accountId = accountId
    this.issueKey = issueKey
  }
}
