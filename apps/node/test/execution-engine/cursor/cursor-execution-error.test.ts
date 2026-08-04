// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { mapCursorExecutionError } from '../../../src/execution-engine/cursor/cursor-execution-error'

describe('mapCursorExecutionError', () => {
  it('maps nested ETIMEDOUT causes to CURSOR_SDK_TIMEOUT', () => {
    const nested = Object.assign(new Error('read ETIMEDOUT'), {
      code: 'ETIMEDOUT',
    })
    const outer = new Error('[unavailable] read ETIMEDOUT', {
      cause: nested,
    })

    const mapped = mapCursorExecutionError(outer)

    expect(mapped).toBeInstanceOf(Error)
    expect(mapped.name).toBe('CursorExecutionError')
    expect(Reflect.get(mapped, 'code')).toBe('CURSOR_SDK_TIMEOUT')
    expect(mapped.message).toContain('ETIMEDOUT')
    expect(mapped.cause).toBe(outer)
  })

  it('maps EPERM to CURSOR_SDK_PERMISSION', () => {
    const error = Object.assign(new Error('operation not permitted'), {
      code: 'EPERM',
    })

    const mapped = mapCursorExecutionError(error)

    expect(Reflect.get(mapped, 'code')).toBe('CURSOR_SDK_PERMISSION')
  })

  it('maps unknown non-Error values', () => {
    const mapped = mapCursorExecutionError('boom')

    expect(Reflect.get(mapped, 'code')).toBe('CURSOR_EXECUTION_FAILED')
    expect(mapped.message).toContain('unknown error')
  })

  it('preserves string error codes from the SDK', () => {
    const error = Object.assign(new Error('rate limited'), {
      code: 'RESOURCE_EXHAUSTED',
    })

    const mapped = mapCursorExecutionError(error)

    expect(Reflect.get(mapped, 'code')).toBe('RESOURCE_EXHAUSTED')
  })

  it('maps ESOCKETTIMEDOUT codes to CURSOR_SDK_TIMEOUT', () => {
    const error = Object.assign(new Error('socket timeout'), {
      code: 'ESOCKETTIMEDOUT',
    })

    expect(Reflect.get(mapCursorExecutionError(error), 'code')).toBe('CURSOR_SDK_TIMEOUT')
  })

  it('maps EACCES codes to CURSOR_SDK_PERMISSION', () => {
    const error = Object.assign(new Error('access denied'), {
      code: 'EACCES',
    })

    expect(Reflect.get(mapCursorExecutionError(error), 'code')).toBe('CURSOR_SDK_PERMISSION')
  })

  it('maps timeout text without a code property', () => {
    const error = new Error('[unavailable] read ETIMEDOUT')

    expect(Reflect.get(mapCursorExecutionError(error), 'code')).toBe('CURSOR_SDK_TIMEOUT')
  })

  it('maps timeout text when code is a non-string value', () => {
    const error = Object.assign(new Error('[unavailable] read ETIMEDOUT'), {
      code: 2,
    })

    expect(Reflect.get(mapCursorExecutionError(error), 'code')).toBe('CURSOR_SDK_TIMEOUT')
  })

  it('maps permission text without a code property', () => {
    const error = new Error('sandbox EPERM: operation not permitted')

    expect(Reflect.get(mapCursorExecutionError(error), 'code')).toBe('CURSOR_SDK_PERMISSION')
  })

  it('falls back to the error name when no code is available', () => {
    const error = new Error('')
    error.name = 'ConnectError'

    expect(Reflect.get(mapCursorExecutionError(error), 'code')).toBe('ConnectError')
    expect(mapCursorExecutionError(error).message).toBe('Cursor agent execution failed')
  })

  it('falls back to CURSOR_EXECUTION_FAILED when name and code are empty', () => {
    const error = new Error('generic failure')
    error.name = ''

    expect(Reflect.get(mapCursorExecutionError(error), 'code')).toBe('CURSOR_EXECUTION_FAILED')
  })

  it('maps permission text when code is a non-string value', () => {
    const error = Object.assign(new Error('sandbox EPERM: operation not permitted'), {
      code: 1,
    })

    expect(Reflect.get(mapCursorExecutionError(error), 'code')).toBe('CURSOR_SDK_PERMISSION')
  })

  it('stops walking a cyclic cause chain', () => {
    const error = new Error('loop')
    error.name = 'ConnectError'
    ;(error as Error & { cause: Error }).cause = error

    expect(Reflect.get(mapCursorExecutionError(error), 'code')).toBe('ConnectError')
  })

  it('maps operation-not-permitted text without EPERM token', () => {
    const error = new Error('operation not permitted by sandbox')

    expect(Reflect.get(mapCursorExecutionError(error), 'code')).toBe('CURSOR_SDK_PERMISSION')
  })
})
