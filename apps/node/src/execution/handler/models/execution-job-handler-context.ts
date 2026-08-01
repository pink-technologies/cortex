// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Runtime context supplied to an {@link ExecutionJobHandler} while it processes
 * a claimed job.
 *
 * Carries only the identifiers and cancellation controls the handler needs to
 * execute work. Job lifecycle reporting (complete / fail) stays with the
 * polling layer so handlers remain focused on kind-specific execution.
 */
export interface ExecutionJobHandlerContext {
  /**
   * Stable identifier of the execution job being processed.
   *
   * Matches the claimed job's `id` and is suitable for correlating logs,
   * artifacts, and protocol results such as `agent.execute` outcomes.
   */
  readonly executionId: string

  /**
   * Abort signal used to cancel cooperative work.
   *
   * Handlers should honor this signal (for example via `throwIfAborted` or by
   * forwarding it to nested runtimes) so Node shutdown and poller cancellation
   * stop in-flight executions promptly.
   */
  readonly signal: AbortSignal
}
