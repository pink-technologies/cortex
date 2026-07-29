// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Canonical kinds of local execution plans supported by the Cortex Node.
 *
 * Use these constants when constructing or discriminating {@link ExecutionPlan}
 * values:
 *
 * - `PROCESS` — run an executable with an explicit argument vector (no shell).
 * - `SHELL` — run a command string through a system shell.
 */
export const ExecutionPlanKind = {
  PROCESS: 'PROCESS',
  SHELL: 'SHELL',
} as const

/** A kind of local execution plan supported by the Cortex Node. */
export type ExecutionPlanKind = (typeof ExecutionPlanKind)[keyof typeof ExecutionPlanKind]

/**
 * Defines the configuration shared by all local execution plans.
 */
export interface ExecutionPlanOptions {
  /**
   * Environment variables provided to the process.
   *
   * These values are merged with the environment selected by the Cortex Node.
   */
  readonly environment?: Readonly<Record<string, string>>

  /**
   * Maximum amount of time the process may run.
   *
   * When omitted, no execution-specific timeout is applied.
   */
  readonly timeoutMilliseconds?: number

  /**
   * Directory from which the process is executed.
   */
  readonly workingDirectory?: string
}

/**
 * Describes the execution of a specific executable with an explicit argument
 * vector.
 *
 * This plan does not use a shell, so each argument is passed directly to the
 * executable without shell interpretation.
 */
export interface ProcessExecutionPlan extends ExecutionPlanOptions {
  /**
   * Arguments passed directly to the executable.
   */
  readonly arguments: readonly string[]

  /**
   * Executable name or resolved executable path.
   */
  readonly executable: string

  /**
   * Identifies this as a direct process execution plan.
   */
  readonly kind: typeof ExecutionPlanKind.PROCESS
}

/**
 * Describes the execution of a command through a system shell.
 *
 * Shell plans support pipelines, redirection, command chaining, and other
 * shell-specific syntax. They should only be created from trusted or approved
 * input.
 */
export interface ShellExecutionPlan extends ExecutionPlanOptions {
  /**
   * Complete command interpreted by the selected shell.
   */
  readonly command: string

  /**
   * Identifies this as a shell execution plan.
   */
  readonly kind: typeof ExecutionPlanKind.SHELL

  /**
   * Optional shell executable.
   *
   * When omitted, the ProcessExecutor selects the default shell for the host
   * operating system.
   */
  readonly shell?: string
}

/**
 * A local execution request supported by the Cortex Node.
 */
export type ExecutionPlan =
  | ProcessExecutionPlan
  | ShellExecutionPlan