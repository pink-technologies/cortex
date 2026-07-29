// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Outcome of a completed local process or shell execution.
 *
 * Captures the command that ran, its buffered stdout/stderr, timing, and the
 * process termination state returned to the Cortex Node.
 */
export interface ExecutionResult {
  /**
   * Command line representation of the executed plan.
   *
   * For process plans this is typically the executable plus arguments; for
   * shell plans it is the shell command string.
   */
  readonly command: string

  /** Elapsed wall-clock time from start to end, in milliseconds. */
  readonly durationMilliseconds: number

  /** Timestamp when the process finished or was terminated. */
  readonly endedAt: Date

  /**
   * Process exit code.
   *
   * `null` when the process exited because of a signal or was otherwise
   * terminated without producing an exit code.
   */
  readonly exitCode: number | null

  /**
   * Signal that terminated the process, when applicable.
   *
   * `null` when the process exited normally with an exit code.
   */
  readonly exitSignal: string | null

  /** Timestamp when the process was started. */
  readonly startedAt: Date

  /** Buffered contents of the process stderr stream. */
  readonly standardError: string

  /** Buffered contents of the process stdout stream. */
  readonly standardOutput: string

  /**
   * Whether the execution is considered successful.
   *
   * Typically `true` when the process exited with code `0` and was not killed
   * by a signal.
   */
  readonly succeeded: boolean
}
