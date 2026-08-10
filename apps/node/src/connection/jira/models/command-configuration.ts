// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Structured executable command used by allowlisted suite runners.
 *
 * Commands are executed without a shell:
 * `spawn(executable, arguments, { cwd, shell: false })`.
 */
export interface CommandConfiguration {
  /**
   * Argument vector passed to {@link executable}.
   */
  readonly arguments: readonly string[]

  /**
   * Program to execute (for example `pnpm` or `xcodebuild`).
   */
  readonly executable: string

  /**
   * Optional positive timeout in milliseconds for this suite.
   */
  readonly timeoutMilliseconds?: number

  /**
   * Working directory relative to the checked-out repository root.
   */
  readonly workingDirectory: string
}

/**
 * Formats a structured command for logs and protocol suite results.
 *
 * @param command - Structured command configuration.
 * @returns Shell-like display string without invoking a shell.
 */
export function formatCommandConfiguration(command: CommandConfiguration): string {
  if (command.arguments.length === 0) {
    return command.executable
  }

  return [command.executable, ...command.arguments].join(' ')
}
