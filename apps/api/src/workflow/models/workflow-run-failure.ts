// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Public failure record persisted on a failed {@link WorkflowRun}.
 *
 * Callers must pass values through {@link sanitizeWorkflowRunFailure} before
 * persistence so stack traces, secrets, and oversized diagnostics are not
 * stored on the run.
 */
export interface WorkflowRunFailure {
  /**
   * Stable machine-readable failure code.
   */
  readonly code: string

  /**
   * Optional bounded details object for clients that need structured context.
   */
  readonly details?: unknown

  /**
   * Human-readable summary safe for operators and API clients.
   */
  readonly message: string
}
