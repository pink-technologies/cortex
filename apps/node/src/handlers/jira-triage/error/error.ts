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

/**
 * Thrown when Jira triage cannot prepare a workspace or run reproduction tests.
 *
 * Covers missing source-control credentials, clone failures, and cancelled or
 * fatal test-runner failures that are not suite-level red results. Preserve the
 * underlying failure in {@link Error.cause}.
 */
export class JiraTriageReproductionError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for reproduction failures.
   */
  readonly code = 'JIRA_TRIAGE_REPRODUCTION_FAILED'

  /**
   * Jira issue key that failed reproduction setup or execution.
   */
  readonly issueKey: string

  // MARK: - Constructor

  /**
   * Creates a reproduction failure.
   *
   * @param issueKey - Issue key that could not be reproduced.
   * @param message - Human-readable description of the failure.
   * @param options - Optional underlying `cause`.
   */
  constructor(issueKey: string, message: string, options?: ErrorOptions) {
    super(message, options)

    this.issueKey = issueKey
  }
}

/**
 * Thrown when a Jira triage regression-test authoring attempt fails fatally.
 *
 * Covers coder-agent resolution/run failures and git branch/commit failures
 * while trying to add failing tests after an initial green suite run. Preserve
 * the underlying failure in {@link Error.cause}.
 */
export class JiraTriageReproError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for repro-authoring failures.
   */
  readonly code = 'JIRA_TRIAGE_REPRO_FAILED'

  /**
   * Jira issue key that failed repro authoring.
   */
  readonly issueKey: string

  // MARK: - Constructor

  /**
   * Creates a repro-authoring failure.
   *
   * @param issueKey - Issue key that could not get authored tests.
   * @param message - Human-readable description of the failure.
   * @param options - Optional underlying `cause`.
   */
  constructor(issueKey: string, message: string, options?: ErrorOptions) {
    super(message, options)

    this.issueKey = issueKey
  }
}

/**
 * Thrown when a Jira triage autofix attempt fails fatally.
 *
 * Covers coder-agent resolution/run failures, git branch/commit/push failures,
 * and draft-PR creation failures. Suite-level red results after a commit are
 * returned as a structured fix with `succeeded: false`, not this error.
 * Preserve the underlying failure in {@link Error.cause}.
 */
export class JiraTriageFixError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for autofix failures.
   */
  readonly code = 'JIRA_TRIAGE_FIX_FAILED'

  /**
   * Jira issue key that failed autofix.
   */
  readonly issueKey: string

  // MARK: - Constructor

  /**
   * Creates an autofix failure.
   *
   * @param issueKey - Issue key that could not be fixed.
   * @param message - Human-readable description of the failure.
   * @param options - Optional underlying `cause`.
   */
  constructor(issueKey: string, message: string, options?: ErrorOptions) {
    super(message, options)

    this.issueKey = issueKey
  }
}
