// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NodeApplicationError } from "../../../error/node-application-error"

/**
 * Canonical reasons a local process execution can fail.
 *
 * - `CANCELLED` — the execution was aborted through an {@link AbortSignal}.
 * - `OUTPUT_LIMIT_EXCEEDED` — captured output exceeded the configured limit.
 * - `START_FAILED` — the process could not be started.
 * - `TERMINATED` — the process was terminated by an external signal.
 * - `TIMED_OUT` — the process exceeded its execution timeout.
 */
export const ProcessExecutorErrorReason = {
  CANCELLED: 'CANCELLED',
  OUTPUT_LIMIT_EXCEEDED: 'OUTPUT_LIMIT_EXCEEDED',
  START_FAILED: 'START_FAILED',
  TERMINATED: 'TERMINATED',
  TIMED_OUT: 'TIMED_OUT',
} as const

/**
 * A machine-readable reason for a process-executor failure.
 */
export type ProcessExecutorErrorReason =
  (typeof ProcessExecutorErrorReason)[keyof typeof ProcessExecutorErrorReason]

/**
 * Additional diagnostic information associated with a process-executor
 * failure.
 */
export interface ProcessExecutorErrorOptions
  extends ErrorOptions {
  /**
   * Command associated with the failed execution.
   */
  readonly command?: string

  /**
   * Standard-error contents captured before the failure.
   */
  readonly standardError?: string

  /**
   * Standard-output contents captured before the failure.
   */
  readonly standardOutput?: string
}

/**
 * Indicates that a local process or shell execution could not complete
 * normally.
 *
 * This error represents infrastructure failures such as cancellation,
 * timeout, output-limit exhaustion, process termination, or failure to start.
 * A process that starts and exits with a nonzero code should instead return an
 * unsuccessful `ExecutionResult`.
 */
export class ProcessExecutorError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Stable category identifying process-executor errors.
   */
  readonly code = 'PROCESS_EXECUTOR_ERROR'

  /**
   * Command associated with the failed execution.
   */
  readonly command?: string

  /**
   * Machine-readable reason for the failure.
   */
  readonly reason: ProcessExecutorErrorReason

  /**
   * Standard-error contents captured before the failure.
   */
  readonly standardError: string

  /**
   * Standard-output contents captured before the failure.
   */
  readonly standardOutput: string

  // MARK: - Constructor

  /**
   * Creates a process-executor failure.
   *
   * @param reason - Machine-readable reason for the failure.
   * @param message - Human-readable description of the failure.
   * @param options - Underlying cause and captured process diagnostics.
   */
  constructor(
    reason: ProcessExecutorErrorReason,
    message: string,
    options: ProcessExecutorErrorOptions = {},
  ) {
    super(message, { cause: options.cause })

    this.command = options.command
    this.name = new.target.name
    this.reason = reason
    this.standardError = options.standardError ?? ''
    this.standardOutput = options.standardOutput ?? ''
  }
}