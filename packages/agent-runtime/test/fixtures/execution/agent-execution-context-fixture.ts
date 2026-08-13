// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentExecutionContext } from '../../../src/execution/agent-execution-context'
import type { AgentToolPermission } from '../../../src/tools/datatypes'

/**
 * Creates an {@link AgentExecutionContext} for agent-runtime tests.
 *
 * @param overrides - Optional execution id, permissions, and abort signal.
 */
export function createAgentExecutionContextFixture(
  overrides: {
    readonly executionId?: string
    readonly permissions?: ReadonlySet<AgentToolPermission>
    readonly signal?: AbortSignal
  } = {},
): AgentExecutionContext {
  return {
    executionId: overrides.executionId ?? 'execution-1',
    permissions: overrides.permissions ?? new Set(),
    signal: overrides.signal ?? new AbortController().signal,
  }
}
