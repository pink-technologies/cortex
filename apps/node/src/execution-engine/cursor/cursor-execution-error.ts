// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Maps a Cursor SDK / transport failure into an {@link Error} with a stable
 * `code` for {@link mapExecutionJobFailure}.
 *
 * @param error - Unknown rejection from {@link Agent.prompt} or nested causes.
 * @returns An Error whose `code` and message are safe to report on the job.
 */
export function mapCursorExecutionError(error: unknown): Error {
  if (error instanceof Error) {
    const code = resolveCursorErrorCode(error)
    const mapped = new Error(error.message || 'Cursor agent execution failed', {
      cause: error,
    })

    Object.defineProperty(mapped, 'code', {
      value: code,
      enumerable: true,
    })

    mapped.name = 'CursorExecutionError'

    return mapped
  }

  const mapped = new Error('Cursor agent execution failed with an unknown error')

  Object.defineProperty(mapped, 'code', {
    value: 'CURSOR_EXECUTION_FAILED',
    enumerable: true,
  })

  mapped.name = 'CursorExecutionError'

  return mapped
}

function resolveCursorErrorCode(error: Error): string {
  for (const candidate of walkErrorChain(error)) {
    const code = Reflect.get(candidate, 'code')

    if (typeof code === 'string' && code.length > 0) {
      if (code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT') {
        return 'CURSOR_SDK_TIMEOUT'
      }

      if (code === 'EPERM' || code === 'EACCES') {
        return 'CURSOR_SDK_PERMISSION'
      }

      return code
    }

    const message = candidate.message

    if (typeof message === 'string' && message.includes('ETIMEDOUT')) {
      return 'CURSOR_SDK_TIMEOUT'
    }

    if (
      typeof message === 'string' &&
      (message.includes('EPERM') || message.includes('operation not permitted'))
    ) {
      return 'CURSOR_SDK_PERMISSION'
    }
  }

  return error.name || 'CURSOR_EXECUTION_FAILED'
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
