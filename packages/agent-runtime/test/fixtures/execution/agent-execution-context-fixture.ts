// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentExecutionContext } from '../../../src/execution/agent-execution-context'

/**
 * Creates an {@link AgentExecutionContext} for kernel tests.
 *
 * @param overrides - Optional execution id and abort signal.
 */
export function createAgentExecutionContextFixture(
  overrides: {
    readonly executionId?: string
    readonly signal?: AbortSignal
  } = {},
): AgentExecutionContext {
  return {
    executionId: overrides.executionId ?? 'execution-1',
    signal: overrides.signal ?? new AbortController().signal,
  }
}
