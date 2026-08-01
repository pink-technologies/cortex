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
  const candidate = Reflect.get(error, 'code')

  if (typeof candidate === 'string' && candidate.length > 0) {
    return candidate
  }

  return error.name || 'EXECUTION_JOB_FAILED'
}
