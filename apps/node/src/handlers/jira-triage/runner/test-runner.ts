// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import { execFile } from 'node:child_process'
import type { JiraTriageTestSuiteResult } from '@cortex/protocol'

/**
 * Allowlisted suite identifiers the triage agent/handler may request.
 */
export type TriageTestSuiteId = 'unit' | 'ui'

/**
 * Runs allowlisted test suite commands inside a prepared workspace.
 *
 * Commands come from the project→repo map (or dry-run reporting), never from
 * unconstrained model output.
 */
@Injectable()
export class TestRunner {
  /**
   * Returns the suites that would run without executing them.
   */
  dryRun(suites: Readonly<Partial<Record<TriageTestSuiteId, string>>>): JiraTriageTestSuiteResult[] {
    return (Object.entries(suites) as [TriageTestSuiteId, string][])
      .filter(([, command]) => Boolean(command))
      .map(([suiteId, command]) => ({
        command,
        suiteId,
        summary: 'dry-run',
      }))
  }

  /**
   * Executes configured suite commands in the workspace via the host shell.
   */
  async run(input: {
    readonly signal: AbortSignal
    readonly suites: Readonly<Partial<Record<TriageTestSuiteId, string>>>
    readonly workingDirectory: string
  }): Promise<JiraTriageTestSuiteResult[]> {
    const results: JiraTriageTestSuiteResult[] = []

    for (const [suiteId, command] of Object.entries(input.suites) as [
      TriageTestSuiteId,
      string | undefined,
    ][]) {
      if (!command) {
        continue
      }

      input.signal.throwIfAborted()

      try {
        const { stdout, stderr } = await this.executeShell(
          command,
          input.workingDirectory,
          input.signal,
        )
        const combined = `${stdout}\n${stderr}`.trim()
        results.push({
          command,
          exitCode: 0,
          suiteId,
          summary: truncate(combined || 'exit 0', 2_000),
        })
      } catch (error) {
        const executionError = error as {
          code?: number | string
          stderr?: string
          stdout?: string
        }
        const exitCode =
          typeof executionError.code === 'number' ? executionError.code : 1
        const combined = `${executionError.stdout ?? ''}\n${executionError.stderr ?? ''}`.trim()

        results.push({
          command,
          exitCode,
          suiteId,
          summary: truncate(combined || `exit ${exitCode}`, 2_000),
        })
      }
    }

    return results
  }

  private executeShell(
    command: string,
    workingDirectory: string,
    signal: AbortSignal,
  ): Promise<{ stderr: string; stdout: string }> {
    return new Promise((resolve, reject) => {
      execFile(
        process.platform === 'win32' ? 'cmd.exe' : 'bash',
        process.platform === 'win32' ? ['/d', '/s', '/c', command] : ['-lc', command],
        {
          cwd: workingDirectory,
          maxBuffer: 2 * 1024 * 1024,
          signal,
          timeout: 15 * 60 * 1000,
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(
              Object.assign(error, {
                stderr: typeof stderr === 'string' ? stderr : '',
                stdout: typeof stdout === 'string' ? stdout : '',
              }),
            )
            return
          }

          resolve({
            stderr: typeof stderr === 'string' ? stderr : '',
            stdout: typeof stdout === 'string' ? stdout : '',
          })
        },
      )
    })
  }
}

function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value
  }

  return `${value.slice(0, max)}…`
}
