// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ExecutionJobFailure } from '@cortex/protocol'

/**
 * Converts an unknown execution error into a protocol-safe failure.
 *
 * Internal stack traces and arbitrary error properties are not sent to the
 * Cortex API.
 *
 * @param error - Error produced while processing an execution job.
 * @returns A normalized execution-job failure.
 */
export function mapExecutionJobFailure(error: unknown): ExecutionJobFailure {
  if (error instanceof Error) {
    return {
      code: resolveErrorCode(error),
      message: error.message || 'Execution job failed',
    }
  }

  return {
    code: 'EXECUTION_JOB_FAILED',
    message: 'Execution job failed with an unknown error',
  }
}

function resolveErrorCode(error: Error): string {
  for (const candidate of walkErrorChain(error)) {
    const code = Reflect.get(candidate, 'code')

    if (typeof code === 'string' && code.length > 0) {
      return code
    }

    if (candidate.name === 'AbortError') {
      return 'CANCELLED'
    }
  }

  return error.name || 'EXECUTION_JOB_FAILED'
}

function* walkErrorChain(error: Error): Generator<Error> {
  let current: unknown = error
  const seen = new Set<Error>()

  while (current instanceof Error && !seen.has(current)) {
    seen.add(current)
    yield current
    current = current.cause
  }
}
