// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import type { AgentTool } from '../../../src/tools'
import { AgentToolEffect, AgentToolIdempotency } from '../../../src/tools'

/**
 * Input accepted by {@link createTestAddTool}.
 */
export type TestAddToolInput = {
  readonly left: number
  readonly right: number
}

/**
 * Output produced by {@link createTestAddTool} when returning an object.
 */
export type TestAddToolOutput = {
  readonly value: number
}

/**
 * Creates a deterministic add tool used by agent-runtime tests.
 *
 * The tool is registered as `test.add`. By default it returns
 * `{ value: left + right }`. Pass `asString: true` to return the sum as a
 * plain string instead.
 */
export function createTestAddTool(
  options: {
    readonly asString?: boolean
  } = {},
): AgentTool<TestAddToolInput, TestAddToolOutput | string> {
  return {
    description: 'Adds two numbers and returns their sum.',
    inputSchema: z.object({
      left: z.number(),
      right: z.number(),
    }),
    metadata: {
      effect: AgentToolEffect.Read,
      idempotency: AgentToolIdempotency.Idempotent,
      permissions: [],
    },
    name: 'test.add',
    outputSchema: options.asString
      ? z.string()
      : z.object({
          value: z.number(),
        }),
    async execute(input): Promise<TestAddToolOutput | string> {
      const value = input.left + input.right

      if (options.asString) {
        return String(value)
      }

      return { value }
    },
  }
}
