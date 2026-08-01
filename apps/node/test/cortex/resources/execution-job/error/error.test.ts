// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  CortexExecutionJobClaimError,
  CortexExecutionJobCompleteError,
  CortexExecutionJobFailError,
} from '../../../../../src/cortex'

describe('CortexExecutionJobClaimError', () => {
  it('stores node id, code, and cause', () => {
    const cause = new Error('transport')
    const error = new CortexExecutionJobClaimError('node-1', { cause })

    expect(error.name).toBe('CortexExecutionJobClaimError')
    expect(error.code).toBe('CORTEX_EXECUTION_JOB_CLAIM_ERROR')
    expect(error.nodeId).toBe('node-1')
    expect(error.message).toContain('node-1')
    expect(error.cause).toBe(cause)
  })
})

describe('CortexExecutionJobCompleteError', () => {
  it('stores job id, code, and cause', () => {
    const cause = new Error('transport')
    const error = new CortexExecutionJobCompleteError('job-1', { cause })

    expect(error.name).toBe('CortexExecutionJobCompleteError')
    expect(error.code).toBe('CORTEX_EXECUTION_JOB_COMPLETE_ERROR')
    expect(error.jobId).toBe('job-1')
    expect(error.message).toContain('job-1')
    expect(error.cause).toBe(cause)
  })
})

describe('CortexExecutionJobFailError', () => {
  it('stores job id, code, and cause', () => {
    const cause = new Error('transport')
    const error = new CortexExecutionJobFailError('job-1', { cause })

    expect(error.name).toBe('CortexExecutionJobFailError')
    expect(error.code).toBe('CORTEX_EXECUTION_JOB_FAIL_ERROR')
    expect(error.jobId).toBe('job-1')
    expect(error.message).toContain('job-1')
    expect(error.cause).toBe(cause)
  })
})
