// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Injection token for the {@link ProcessExecutionPolicy} configuration.
 *
 * Register a concrete policy with this token in the execution module and inject
 * it via `@Inject(PROCESS_EXECUTION_POLICY)`.
 */
export const PROCESS_EXECUTION_POLICY = Symbol('PROCESS_EXECUTION_POLICY')

/**
 * Host-level safety and resource limits applied to every local process
 * execution.
 *
 * These values are shared across plans and are passed through to the underlying
 * process runner (for example execa) when starting work.
 */
export interface ProcessExecutionPolicy {
  /**
   * Delay before a gracefully terminated process is forcefully killed.
   *
   * Provide a positive millisecond delay, or `false` to disable forced kill.
   */
  readonly forceKillAfterDelayMilliseconds: number | false

  /**
   * Whether process termination should also terminate descendant child
   * processes.
   */
  readonly killDescendants: boolean

  /**
   * Maximum captured output size for each of stdout and stderr, in bytes.
   *
   * Executions that exceed this limit fail rather than buffering unbounded
   * output.
   */
  readonly maxBuffer: number
}
