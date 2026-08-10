// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import { spawn } from 'node:child_process'
import path from 'node:path'
import type { JiraTriageTestSuiteResult } from '@cortex/protocol'
import {
  formatCommandConfiguration,
  type CommandConfiguration,
} from '../../../connection'
import {
  commandNeedsIosSimulatorDestination,
  IosSimulatorDestinationNotFoundError,
  IosSimulatorDestinationResolver,
  rewriteIosSimulatorDestination,
} from './ios-simulator-destination-resolver'

/**
 * Allowlisted suite identifier from the project→repo map.
 */
export type TriageTestSuiteId = string

/**
 * Default suite timeout when a suite omits `timeoutMilliseconds`.
 */
const DEFAULT_SUITE_TIMEOUT_MILLISECONDS = 15 * 60 * 1000

/**
 * Env keys mirrored into XCTest via Xcode's `TEST_RUNNER_` forwarding.
 *
 * `xcodebuild test` does not pass the parent shell environment into the
 * simulator test host. Variables prefixed with `TEST_RUNNER_` are copied into
 * the XCTest process with that prefix stripped.
 */
const XCTEST_FORWARDED_ENV_KEYS = [
  'TRUVIDEO_ACCESS_TOKEN',
  'TRUVIDEO_REFRESH_TOKEN',
] as const

/**
 * Runs allowlisted structured suite commands inside a prepared workspace.
 *
 * Commands come from TOML project configuration, never from unconstrained model
 * output. Subprocesses spawn without a shell (`shell: false`).
 *
 * When any suite uses an iOS Simulator destination, this runner resolves one
 * available iPhone simulator on the Node first and rewrites those destinations
 * to a concrete `id=<udid>` so hard-coded device names do not break across hosts.
 */
@Injectable()
export class TestRunner {
  // MARK: - Constructor

  /**
   * Creates a test runner.
   *
   * @param iosSimulatorDestinationResolver - Resolves a concrete iPhone
   *   simulator before iOS suite commands execute.
   */
  constructor(
    private readonly iosSimulatorDestinationResolver: IosSimulatorDestinationResolver,
  ) {}

  // MARK: - Instance methods

  /**
   * Returns the suites that would run without executing them.
   */
  dryRun(
    suites: Readonly<Record<string, CommandConfiguration>>,
  ): JiraTriageTestSuiteResult[] {
    return Object.entries(suites).map(([suiteId, command]) => ({
      command: formatCommandConfiguration(command),
      suiteId,
      summary: 'dry-run',
    }))
  }

  /**
   * Executes configured suite commands in the workspace without a shell.
   *
   * Resolves an iOS Simulator destination once when needed, then rewrites each
   * matching suite command before execution.
   */
  async run(input: {
    readonly signal: AbortSignal
    readonly suites: Readonly<Record<string, CommandConfiguration>>
    readonly workingDirectory: string
  }): Promise<JiraTriageTestSuiteResult[]> {
    const results: JiraTriageTestSuiteResult[] = []
    const suiteEntries = Object.entries(input.suites)

    let iosDestination: string | undefined
    let iosResolveError: unknown

    if (suiteEntries.some(([, command]) => commandNeedsIosSimulatorDestination(command))) {
      try {
        const resolved = await this.iosSimulatorDestinationResolver.resolve(input.signal)
        iosDestination = resolved.destination
      } catch (error) {
        if (isCancellationError(error, input.signal)) {
          throw error
        }

        iosResolveError = error
      }
    }

    for (const [suiteId, command] of suiteEntries) {
      input.signal.throwIfAborted()

      const displayCommand = formatCommandConfiguration(command)
      const needsIosDestination = commandNeedsIosSimulatorDestination(command)

      if (needsIosDestination && iosResolveError) {
        results.push({
          command: displayCommand,
          exitCode: 70,
          suiteId,
          summary: summarizeIosSimulatorResolveFailure(iosResolveError),
        })
        continue
      }

      const effectiveCommand =
        needsIosDestination && iosDestination
          ? rewriteIosSimulatorDestination(command, iosDestination)
          : command

      const effectiveDisplay = formatCommandConfiguration(effectiveCommand)
      const suiteWorkingDirectory = resolveSuiteWorkingDirectory(
        input.workingDirectory,
        effectiveCommand.workingDirectory,
      )

      try {
        const { stdout, stderr } = await this.executeCommand(
          effectiveCommand,
          suiteWorkingDirectory,
          input.signal,
        )
        const combined = `${stdout}\n${stderr}`.trim()
        results.push({
          command: effectiveDisplay,
          exitCode: 0,
          suiteId,
          summary: truncate(combined || 'exit 0', 2_000),
        })
      } catch (error) {
        if (isCancellationError(error, input.signal)) {
          throw error
        }

        const executionError = error as {
          code?: number | string
          stderr?: string
          stdout?: string
        }
        const exitCode =
          typeof executionError.code === 'number' ? executionError.code : 1
        const combined = `${executionError.stdout || ''}\n${executionError.stderr || ''}`.trim()

        results.push({
          command: effectiveDisplay,
          exitCode,
          suiteId,
          summary: truncate(combined || `exit ${exitCode}`, 2_000),
        })
      }
    }

    return results
  }

  private executeCommand(
    command: CommandConfiguration,
    workingDirectory: string,
    signal: AbortSignal,
  ): Promise<{ stderr: string; stdout: string }> {
    const timeoutMilliseconds =
      command.timeoutMilliseconds ?? DEFAULT_SUITE_TIMEOUT_MILLISECONDS

    return new Promise((resolve, reject) => {
      const stdoutChunks: Buffer[] = []
      const stderrChunks: Buffer[] = []
      const child = spawn(command.executable, [...command.arguments], {
        cwd: workingDirectory,
        env: buildSuiteProcessEnv(process.env),
        shell: false,
        signal,
      })

      child.stdout?.on('data', (chunk: Buffer | string) => {
        stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      })
      child.stderr?.on('data', (chunk: Buffer | string) => {
        stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      })

      const timeout = setTimeout(() => {
        child.kill('SIGTERM')
      }, timeoutMilliseconds)

      const finish = (handler: () => void) => {
        clearTimeout(timeout)
        handler()
      }

      child.on('error', (error) => {
        finish(() => {
          reject(
            Object.assign(error, {
              stderr: Buffer.concat(stderrChunks).toString('utf8'),
              stdout: Buffer.concat(stdoutChunks).toString('utf8'),
            }),
          )
        })
      })

      child.on('close', (code) => {
        finish(() => {
          const stdout = Buffer.concat(stdoutChunks).toString('utf8')
          const stderr = Buffer.concat(stderrChunks).toString('utf8')

          if (code === 0) {
            resolve({ stderr, stdout })
            return
          }

          reject(
            Object.assign(new Error(`Command failed with exit code ${code ?? 1}`), {
              code: typeof code === 'number' ? code : 1,
              stderr,
              stdout,
            }),
          )
        })
      })
    })
  }
}

/**
 * Builds the environment for an allowlisted suite subprocess.
 *
 * Copies `source`, then for each XCTest-forwarded secret that is set, adds
 * `TEST_RUNNER_<KEY>` so `xcodebuild test` injects `<KEY>` into the XCTest
 * process.
 *
 * @param source - Usually {@link process.env} after node dotenv load.
 * @returns Env map passed to the suite subprocess.
 */
export function buildSuiteProcessEnv(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...source }

  for (const key of XCTEST_FORWARDED_ENV_KEYS) {
    const value = source[key]?.trim()

    if (!value) {
      continue
    }

    env[`TEST_RUNNER_${key}`] = value
  }

  return env
}

/**
 * Resolves a suite working directory under the repository root.
 *
 * @param repositoryRoot - Absolute prepared workspace path.
 * @param relativeWorkingDirectory - Relative directory from suite configuration.
 * @returns Absolute path that stays inside the repository.
 */
function resolveSuiteWorkingDirectory(
  repositoryRoot: string,
  relativeWorkingDirectory: string,
): string {
  const root = path.resolve(repositoryRoot)
  const resolved = path.resolve(root, relativeWorkingDirectory)
  const relative = path.relative(root, resolved)

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(
      `Suite working directory '${relativeWorkingDirectory}' resolves outside the repository.`,
    )
  }

  return resolved
}

/**
 * Truncates suite output while keeping both the start and the failure-rich end.
 *
 * xcodebuild / SwiftLint diagnostics usually appear at the end of a long log;
 * keeping only the head caused `suite_broken` markers to be dropped.
 */
function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value
  }

  const marker = '\n…\n'
  const budget = max - marker.length

  if (budget <= 1) {
    return `${value.slice(0, Math.max(0, max - 1))}…`
  }

  const headLength = Math.max(1, Math.floor(budget * 0.35))
  const tailLength = Math.max(1, budget - headLength)

  return `${value.slice(0, headLength)}${marker}${value.slice(-tailLength)}`
}

/**
 * Returns true when the suite was stopped by cancellation rather than a test failure.
 */
function isCancellationError(error: unknown, signal: AbortSignal): boolean {
  if (signal.aborted) {
    return true
  }

  return error instanceof Error && error.name === 'AbortError'
}

function summarizeIosSimulatorResolveFailure(error: unknown): string {
  if (error instanceof IosSimulatorDestinationNotFoundError) {
    return (
      'xcodebuild: error: Unable to find a destination matching the provided ' +
      `destination specifier. ${error.message}`
    )
  }

  const message = error instanceof Error ? error.message : String(error)
  return (
    'xcodebuild: error: Unable to find a destination matching the provided ' +
    `destination specifier. Failed to resolve an iOS Simulator: ${message}`
  )
}
