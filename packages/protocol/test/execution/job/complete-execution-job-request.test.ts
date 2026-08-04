// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { CompleteExecutionJobRequestSchema } from '../../../src/execution/job/complete-execution-job-request'

const baseRequest = {
  claimToken: '11111111-1111-4111-8111-111111111111',
  nodeId: '22222222-2222-4222-8222-222222222222',
}

describe('CompleteExecutionJobRequestSchema', () => {
  it('accepts an opaque kind-specific result', () => {
    const request = CompleteExecutionJobRequestSchema.parse({
      ...baseRequest,
      result: {
        executionId: 'exec-1',
        iterationCount: 2,
        output: 'Done.',
      },
    })

    expect(request).toEqual({
      ...baseRequest,
      result: {
        executionId: 'exec-1',
        iterationCount: 2,
        output: 'Done.',
      },
    })
  })

  it('accepts completion without a result', () => {
    const request = CompleteExecutionJobRequestSchema.parse(baseRequest)

    expect(request).toEqual(baseRequest)
  })

  it('rejects a malformed claim token', () => {
    expect(() =>
      CompleteExecutionJobRequestSchema.parse({
        ...baseRequest,
        claimToken: 'not-a-uuid',
      }),
    ).toThrow()
  })

  it('rejects a malformed node id', () => {
    expect(() =>
      CompleteExecutionJobRequestSchema.parse({
        ...baseRequest,
        nodeId: 'node-1',
      }),
    ).toThrow()
  })

  it('rejects unknown properties', () => {
    expect(() =>
      CompleteExecutionJobRequestSchema.parse({
        ...baseRequest,
        unexpected: true,
      }),
    ).toThrow()
  })
})
