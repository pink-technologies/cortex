// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import type { AgentTool } from '../../../src/tool'

/**
 * Creates a tool that always fails during execution.
 *
 * Useful for verifying that tool failures surface as
 * {@link AgentToolExecutionError}.
 */
export function createFailingAgentTool(
  options: {
    readonly message?: string
    readonly name?: string
  } = {},
): AgentTool<Record<string, never>, never> {
  const message = options.message ?? 'The failing agent tool failed intentionally.'

  return {
    description: 'A tool that always fails when executed.',
    inputSchema: z.object({}),
    name: options.name ?? 'test.fail',
    async execute(): Promise<never> {
      throw new Error(message)
    },
  }
}
