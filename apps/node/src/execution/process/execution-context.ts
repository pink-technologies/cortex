// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Canonical streams that emit process output during local execution.
 *
 * Use these constants when constructing or discriminating
 * {@link ExecutionOutputEvent} values:
 *
 * - `STANDARD_OUTPUT` — data written to the process stdout stream.
 * - `STANDARD_ERROR` — data written to the process stderr stream.
 */
export const ExecutionOutputKind = {
  STANDARD_ERROR: 'STANDARD_ERROR',
  STANDARD_OUTPUT: 'STANDARD_OUTPUT',
} as const

/** A process output stream kind observed during local execution. */
export type ExecutionOutputKind =
  (typeof ExecutionOutputKind)[keyof typeof ExecutionOutputKind]

/**
 * A chunk of process output observed while an execution plan runs.
 */
export interface ExecutionOutputEvent {
  /** UTF-8 text contents of the output chunk. */
  readonly contents: string

  /** Stream that produced the chunk. */
  readonly kind: ExecutionOutputKind

  /** Timestamp when the chunk was observed. */
  readonly occurredAt: Date
}

/**
 * Caller-supplied controls for a single local process execution.
 *
 * Provides optional output observation and cooperative cancellation for
 * {@link ProcessExecutor} runs.
 */
export interface ExecutionContext {
  /**
   * Invoked for each stdout or stderr chunk emitted by the process.
   *
   * When omitted, output is still captured by the executor but not streamed to
   * the caller.
   */
  readonly onOutput?: (event: ExecutionOutputEvent) => void

  /**
   * Abort signal used to cancel the running process.
   *
   * When aborted, the executor terminates the process and fails the execution.
   */
  readonly signal?: AbortSignal
}
