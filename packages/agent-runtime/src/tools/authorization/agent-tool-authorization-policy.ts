// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentExecutionContext } from '@/execution/agent-execution-context'
import { AgentToolMetadata } from '../models'

/**
 * Determines whether a tool may be exposed or executed within an agent
 * execution.
 *
 * The same policy must be used when exposing tools to the language model and
 * when executing tool requests.
 *
 * @typeParam Context - Runtime context used to authorize tool access.
 */
export interface AgentToolAuthorizationPolicy<Context extends AgentExecutionContext = AgentExecutionContext> {
  /**
   * Determines whether the tool described by `metadata` may be exposed or
   * executed for this run.
   *
   * @param metadata - Declarative effect, idempotency, and permission metadata
   *   for the tool under consideration.
   * @param context - Current agent execution context.
   * @returns `true` when the tool may be exposed or executed; otherwise
   *   `false`.
   */
  allows(metadata: AgentToolMetadata, context: Context): Promise<boolean>
}
