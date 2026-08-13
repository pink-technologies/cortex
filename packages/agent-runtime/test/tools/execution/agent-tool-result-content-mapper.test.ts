// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ContentKind } from '@cortex/llm'
import {
  AgentToolResultContentMapper,
  type AgentToolExecutionResult,
} from '../../../src/tools'

/**
 * Builds an {@link AgentToolExecutionResult} for mapper tests.
 */
function createResult(
  overrides: {
    readonly output?: unknown
    readonly toolName?: string
    readonly toolUseId?: string
  } = {},
): AgentToolExecutionResult {
  return {
    output: overrides.output,
    toolName: overrides.toolName ?? 'test.tool',
    toolUseId: overrides.toolUseId ?? 'tool-use-1',
  }
}

describe('AgentToolResultContentMapper', () => {
  const mapper = new AgentToolResultContentMapper()

  describe('Given a successful tool execution result', () => {
    describe('When map is called', () => {
      it('Then returns ToolResult content correlated by toolUseId without isError', () => {
        const result = mapper.map(
          createResult({
            output: { value: 5 },
            toolUseId: 'tool-use-preserve',
          }),
        )

        expect(result).toEqual({
          content: '{"value":5}',
          toolUseId: 'tool-use-preserve',
          type: ContentKind.ToolResult,
        })
        expect(result).not.toHaveProperty('isError')
      })
    })
  })

  describe('Given a string output', () => {
    describe('When map is called', () => {
      it('Then returns the string as-is', () => {
        const result = mapper.map(createResult({ output: 'plain text' }))

        expect(result.content).toBe('plain text')
      })
    })
  })

  describe('Given undefined output', () => {
    describe('When map is called', () => {
      it('Then serializes to the literal string null', () => {
        const result = mapper.map(createResult({ output: undefined }))

        expect(result.content).toBe('null')
      })
    })
  })

  describe('Given a JSON-serializable object output', () => {
    describe('When map is called', () => {
      it('Then JSON-encodes the value', () => {
        const result = mapper.map(
          createResult({
            output: { left: 1, right: ['a', null] },
          }),
        )

        expect(result.content).toBe('{"left":1,"right":["a",null]}')
      })
    })
  })

  describe('Given null output', () => {
    describe('When map is called', () => {
      it('Then JSON-encodes null', () => {
        const result = mapper.map(createResult({ output: null }))

        expect(result.content).toBe('null')
      })
    })
  })

  describe('Given an output that JSON.stringify cannot encode', () => {
    describe('When map is called', () => {
      it('Then falls back to String coercion', () => {
        const output = Symbol('tool-output')
        const result = mapper.map(createResult({ output }))

        expect(result.content).toBe(String(output))
      })
    })
  })
})
