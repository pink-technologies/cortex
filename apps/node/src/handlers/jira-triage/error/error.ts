// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NodeApplicationError } from '../../../error/error'

/**
 * Thrown when Jira triage classification fails.
 *
 * Covers execution-engine failures and invalid/unparseable classifier output.
 * Preserve the underlying failure in {@link Error.cause}.
 */
export class JiraTriageClassificationError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for classification failures.
   */
  readonly code = 'JIRA_TRIAGE_CLASSIFICATION_FAILED'

  /**
   * Jira issue key being classified, when known.
   */
  readonly issueKey: string | undefined

  // MARK: - Constructor

  /**
   * Creates a classification failure.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional issue key and underlying `cause`.
   */
  constructor(
    message: string,
    options?: ErrorOptions & {
      readonly issueKey?: string
    },
  ) {
    super(message, options)

    this.issueKey = options?.issueKey
  }
}

/**
 * Thrown when Jira triage escalation (comment and/or reassign) fails.
 *
 * Preserve the underlying Jira client failure in {@link Error.cause}.
 */
export class JiraTriageEscalationError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for escalation failures.
   */
  readonly code = 'JIRA_TRIAGE_ESCALATION_FAILED'

  /**
   * Jira issue key that failed to escalate.
   */
  readonly issueKey: string

  // MARK: - Constructor

  /**
   * Creates an escalation failure.
   *
   * @param issueKey - Issue key that could not be escalated.
   * @param message - Human-readable description of the failure.
   * @param options - Optional underlying `cause`.
   */
  constructor(issueKey: string, message: string, options?: ErrorOptions) {
    super(message, options)

    this.issueKey = issueKey
  }
}
