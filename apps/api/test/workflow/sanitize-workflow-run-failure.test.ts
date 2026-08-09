// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { WorkflowRunFailureCode } from '../../src/workflow/datatypes'
import { sanitizeWorkflowRunFailure } from '../../src/workflow/sanitize'

describe('sanitizeWorkflowRunFailure', () => {
  it('defaults nullish sources to a job-failed record', () => {
    expect(sanitizeWorkflowRunFailure(null)).toEqual({
      code: WorkflowRunFailureCode.JOB_FAILED,
      message: 'Execution job failed',
    })
  })

  it('keeps public code and message fields', () => {
    expect(
      sanitizeWorkflowRunFailure({
        code: 'TRIAGE_FAILED',
        message: 'classifier unavailable',
      }),
    ).toEqual({
      code: 'TRIAGE_FAILED',
      message: 'classifier unavailable',
    })
  })

  it('redacts sensitive keys and caps oversized details', () => {
    const sanitized = sanitizeWorkflowRunFailure({
      code: 'PROVIDER_ERROR',
      message: 'upstream failed',
      stack: 'Error: secret\n    at handler',
      token: 'super-secret',
      details: {
        password: 'hunter2',
        reason: 'timeout',
      },
    })

    expect(sanitized).toEqual({
      code: 'PROVIDER_ERROR',
      message: 'upstream failed',
      details: {
        reason: 'timeout',
      },
    })

    const oversized = sanitizeWorkflowRunFailure({
      code: 'BIG',
      message: 'too much',
      details: { blob: 'x'.repeat(10_000) },
    })

    expect(oversized.details).toEqual(
      expect.objectContaining({
        truncated: true,
      }),
    )
  })
})
