// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { CompleteExecutionJobRequestSchema } from '../../../src/execution/job/complete-execution-job-request'

const baseRequest = {
  claimToken: '11111111-1111-4111-8111-111111111111',
  nodeId: 'node-1',
}

describe('CompleteExecutionJobRequestSchema', () => {
  it('accepts an agent execution result', () => {
    const request = CompleteExecutionJobRequestSchema.parse({
      ...baseRequest,
      result: {
        executionId: 'exec-1',
        iterationCount: 2,
        output: 'Done.',
        usage: {
          inputTokens: 10,
          outputTokens: 4,
          totalTokens: 14,
        },
      },
    })

    expect(request).toEqual({
      ...baseRequest,
      result: {
        executionId: 'exec-1',
        iterationCount: 2,
        output: 'Done.',
        usage: {
          inputTokens: 10,
          outputTokens: 4,
          totalTokens: 14,
        },
      },
    })
  })

  it('accepts completion without a result', () => {
    const request = CompleteExecutionJobRequestSchema.parse(baseRequest)

    expect(request).toEqual(baseRequest)
  })

  it('rejects an invalid agent execution result', () => {
    expect(() =>
      CompleteExecutionJobRequestSchema.parse({
        ...baseRequest,
        result: {
          executionId: 'exec-1',
          iterationCount: 0,
          output: 'Done.',
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
          },
        },
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
