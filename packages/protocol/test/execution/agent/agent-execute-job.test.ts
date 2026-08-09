// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  AgentExecuteJobPayloadSchema,
  AgentExecuteJobResultSchema,
} from '../../../src/execution/agent'

describe('AgentExecuteJobPayloadSchema', () => {
  it('parses a valid agent execution payload', () => {
    const payload = AgentExecuteJobPayloadSchema.parse({
      agentId: 'assistant',
      input: 'Summarize the latest status.',
      toolNames: ['web_search', 'file_read'],
    })

    expect(payload).toEqual({
      agentId: 'assistant',
      input: 'Summarize the latest status.',
      toolNames: ['web_search', 'file_read'],
    })
  })

  it('defaults toolNames to an empty array', () => {
    const payload = AgentExecuteJobPayloadSchema.parse({
      agentId: 'assistant',
      input: 'Hello',
    })

    expect(payload.toolNames).toEqual([])
  })

  it('rejects an empty agent identifier', () => {
    expect(() =>
      AgentExecuteJobPayloadSchema.parse({
        agentId: '   ',
        input: 'Hello',
      }),
    ).toThrow()
  })

  it('rejects empty input', () => {
    expect(() =>
      AgentExecuteJobPayloadSchema.parse({
        agentId: 'assistant',
        input: '',
      }),
    ).toThrow()
  })

  it('rejects unknown payload properties', () => {
    expect(() =>
      AgentExecuteJobPayloadSchema.parse({
        agentId: 'assistant',
        input: 'Hello',
        unexpected: true,
      }),
    ).toThrow()
  })
})

describe('AgentExecuteJobResultSchema', () => {
  it('parses a valid agent execution result', () => {
    const result = AgentExecuteJobResultSchema.parse({
      executionId: 'exec-1',
      iterationCount: 2,
      output: 'Done.',
      usage: {
        inputTokens: 10,
        outputTokens: 4,
        totalTokens: 14,
      },
    })

    expect(result).toEqual({
      executionId: 'exec-1',
      iterationCount: 2,
      output: 'Done.',
      usage: {
        inputTokens: 10,
        outputTokens: 4,
        totalTokens: 14,
      },
    })
  })

  it('rejects negative token usage', () => {
    expect(() =>
      AgentExecuteJobResultSchema.parse({
        executionId: 'exec-1',
        iterationCount: 1,
        output: 'Done.',
        usage: {
          inputTokens: -1,
          outputTokens: 0,
          totalTokens: 0,
        },
      }),
    ).toThrow()
  })

  it('rejects a non-positive iteration count', () => {
    expect(() =>
      AgentExecuteJobResultSchema.parse({
        executionId: 'exec-1',
        iterationCount: 0,
        output: 'Done.',
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        },
      }),
    ).toThrow()
  })
})
