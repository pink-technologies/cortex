// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { mapExecutionJobFailure } from '../../../../src/execution/jobs/processing/execution-job-failure-mapper'

describe('mapExecutionJobFailure', () => {
  it('uses a string code from the error when present', () => {
    const error = Object.assign(new Error('timed out'), {
      code: 'CURSOR_SDK_TIMEOUT',
    })

    expect(mapExecutionJobFailure(error)).toEqual({
      code: 'CURSOR_SDK_TIMEOUT',
      message: 'timed out',
    })
  })

  it('walks the cause chain for a string code', () => {
    const nested = Object.assign(new Error('read ETIMEDOUT'), {
      code: 'ETIMEDOUT',
    })
    const outer = new Error('Cursor failed', {
      cause: nested,
    })

    expect(mapExecutionJobFailure(outer)).toEqual({
      code: 'ETIMEDOUT',
      message: 'Cursor failed',
    })
  })

  it('maps AbortError to CANCELLED', () => {
    const error = new Error('This operation was aborted')
    error.name = 'AbortError'

    expect(mapExecutionJobFailure(error)).toEqual({
      code: 'CANCELLED',
      message: 'This operation was aborted',
    })
  })

  it('maps unknown values to a generic failure', () => {
    expect(mapExecutionJobFailure('boom')).toEqual({
      code: 'EXECUTION_JOB_FAILED',
      message: 'Execution job failed with an unknown error',
    })
  })

  it('uses a fallback message when the error message is empty', () => {
    const error = Object.assign(new Error(''), {
      code: 'CURSOR_SDK_TIMEOUT',
    })

    expect(mapExecutionJobFailure(error)).toEqual({
      code: 'CURSOR_SDK_TIMEOUT',
      message: 'Execution job failed',
    })
  })

  it('falls back to EXECUTION_JOB_FAILED when name and code are empty', () => {
    const error = new Error('failed')
    error.name = ''

    expect(mapExecutionJobFailure(error)).toEqual({
      code: 'EXECUTION_JOB_FAILED',
      message: 'failed',
    })
  })
})
