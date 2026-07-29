// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { execa, type Result } from "execa"
import { type ExecutionContext, ExecutionOutputKind } from "../execution-context"
import { type ExecutionPlan, ExecutionPlanKind } from "../execution-plan"
import { ProcessExecutorError, ProcessExecutorErrorReason } from "../error/error"
import { type ProcessExecutionPolicy } from "./process-execution-policy"
import { type ExecutionResult } from "../result/execution-result"

/**
 * Injection token for the {@link ProcessExecutor} implementation.
 *
 * Register the concrete executor with this token in the execution module and
 * inject it via `@Inject(PROCESS_EXECUTOR)`.
 */
export const PROCESS_EXECUTOR = Symbol('PROCESS_EXECUTOR')

/**
 * Runs a local {@link ExecutionPlan} and returns a buffered
 * {@link ExecutionResult}.
 *
 * Implementations apply host safety limits from {@link ProcessExecutionPolicy},
 * honor cancellation and output callbacks from {@link ExecutionContext}, and
 * surface failures as {@link ProcessExecutorError}.
 */
export interface ProcessExecutor {
  /**
   * Executes the given plan and waits for it to finish.
   *
   * @param plan - Process or shell plan describing what to run.
   * @param context - Optional abort signal and live output observer.
   * @returns The completed execution outcome, including stdout/stderr buffers.
   * @throws {ProcessExecutorError} When execution times out, is cancelled,
   * exceeds buffer limits, is terminated, or cannot be started.
   */
  execute(
    plan: ExecutionPlan,
    context?: ExecutionContext,
  ): Promise<ExecutionResult>
}

/**
 * Default {@link ProcessExecutor} backed by execa.
 *
 * Dispatches {@link ExecutionPlanKind.PROCESS} and
 * {@link ExecutionPlanKind.SHELL} plans through a shared command runner, streams
 * output chunks via {@link ExecutionContext.onOutput}, and maps unsuccessful
 * execa results into {@link ProcessExecutorError}.
 */
export class ProcessExecutorImpl implements ProcessExecutor {
  // MARK: - Constructor

  /**
   * Creates a process executor.
   *
   * @param policy - Shared force-kill, descendant, and buffer limits applied to
   *   every execution.
   */
  constructor(private readonly policy: ProcessExecutionPolicy) {}

  // MARK: - ProcessExecutor

  /**
   * Executes a process or shell plan and returns its buffered outcome.
   *
   * Successful runs produce an {@link ExecutionResult}. Failed runs are converted
   * by {@link ExecutionResultValidator} and rethrown as
   * {@link ProcessExecutorError}.
   *
   * @param plan - Local execution request to run.
   * @param context - Cancellation and output-observation controls.
   * @returns The completed execution result, including unsuccessful numeric
   * exit codes.
   * @throws {ProcessExecutorError} When execution fails for any reason.
   */
  async execute(plan: ExecutionPlan, context: ExecutionContext = {}): Promise<ExecutionResult> {
    try {
      const startedAt = new Date()
      const result = await (async () => {
        switch (plan.kind) {
          case ExecutionPlanKind.PROCESS:
            return this.executeCommand(plan.executable, {
              ...plan,
              context,
              arguments: [...plan.arguments],
              shell: false,
            })

          case ExecutionPlanKind.SHELL:
            return this.executeCommand(plan.command, {
              ...plan,
              context,
              arguments: [],
              shell: plan.shell ?? true,
            })
        }
      })()

      ExecutionResultValidator.validate(result)

      const endedAt = new Date()

      return {
        command: result.command,
        durationMilliseconds: result.durationMs,
        endedAt,
        exitCode: result.exitCode ?? null,
        exitSignal: result.signal ?? null,
        standardError: typeof result.stderr === 'string' ? result.stderr : '',
        standardOutput: typeof result.stdout === 'string' ? result.stdout: '',
        startedAt,
        succeeded: result.exitCode === 0,
      }
    } catch (error) {
      if ( error instanceof ProcessExecutorError) throw error
    
      throw new ProcessExecutorError(
        ProcessExecutorErrorReason.START_FAILED, 
        'Failed to execute process', 
        {
          cause: error,
        }
      )
    }
  }

  // MARK: - Private methods

  private executeCommand(
    command: string,
    options: {
      context: ExecutionContext
      arguments: string[]
      environment?: Readonly<Record<string, string>>
      shell: boolean | string,
      timeoutMilliseconds?: number
      workingDirectory?: string
    },
  ) {
    return execa(
      command,
      [...options.arguments],
      {
        cancelSignal: options.context.signal,
        cwd: options.workingDirectory,
        env: options.environment,
        extendEnv: true,        
        forceKillAfterDelay: this.policy.forceKillAfterDelayMilliseconds,
        killDescendants: this.policy.killDescendants,
        maxBuffer: this.policy.maxBuffer,        
        shell: options.shell,
        reject: false,
        timeout: options.timeoutMilliseconds,
        stderr: this.outputTransformer(
          options.context,
          ExecutionOutputKind.STANDARD_ERROR,
        ),
        stdout: this.outputTransformer(
          options.context,
          ExecutionOutputKind.STANDARD_OUTPUT,
        ),
      },
    )
  }

  private outputTransformer(
    context: ExecutionContext,
    kind:
      | typeof ExecutionOutputKind.STANDARD_ERROR
      | typeof ExecutionOutputKind.STANDARD_OUTPUT,
  ) {
    return function* (contents: string): Generator<string> {
      context.onOutput?.({
        contents,
        kind,
        occurredAt: new Date(),
      })

      yield contents
    }
  }
}

/**
 * Validates unsuccessful Execa results and surfaces infrastructure failures as
 * typed {@link ProcessExecutorError} instances.
 *
 * Numeric nonzero exit codes are accepted and returned to the caller through
 * {@link ExecutionResult}.
 */
class ExecutionResultValidator {
  // MARK: - Static methods

  /**
  * Validates an Execa execution result.
  *
  * @param result - Execution result produced with `reject: false`.
  * @throws {ProcessExecutorError} When execution times out, is cancelled,
  * exceeds its output limit, is terminated, or cannot be started.
  */
  static validate(result: Result) {
    if (!result.failed) return

    const standardError = typeof result.stderr === 'string' ? result.stderr : ''
    const standardOutput = typeof result.stdout === 'string' ? result.stdout : ''
    const options = {
      command: result.command,
      standardError,
      standardOutput,
    }

    if (result.timedOut) {
      throw new ProcessExecutorError(
        ProcessExecutorErrorReason.TIMED_OUT, 
        `Process '${result.command}' timed out.`, 
        options
      )
    }

    if (result.isCanceled) {
      throw new ProcessExecutorError(
        ProcessExecutorErrorReason.CANCELLED,
       `Process '${result.command}' was cancelled.`,
        options
      )
    }

    if (result.isMaxBuffer) {
      throw new ProcessExecutorError(
        ProcessExecutorErrorReason.OUTPUT_LIMIT_EXCEEDED,
        `Process '${result.command}' exceeded the buffer size.`,
        options
      )
    }

    if (result.isTerminated) {
      const message = result.signal === undefined
          ? `Process '${result.command}' was terminated.`
          : `Process '${result.command}' was terminated by ${result.signal}.`

      throw new ProcessExecutorError(
        ProcessExecutorErrorReason.TERMINATED,
        message,
        options,
      )
    }

    if (result.exitCode === undefined) {
      throw new ProcessExecutorError(
        ProcessExecutorErrorReason.START_FAILED,
        result.shortMessage ?? `Process '${result.command}' exited with an unknown code.`,
        options
      )
    }
  }
}
