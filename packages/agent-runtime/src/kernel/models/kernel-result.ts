// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { LLMMessage, TokenUsage } from '@cortex/llm'
import type { AgentTurn } from '@/agent'

/**
 * Represents the successful result of a {@link Kernel} execution.
 *
 * The result includes the final turn produced by the agent, the completed
 * conversation, accumulated token usage, and the number of agent iterations
 * required to finish the execution.
 */
export interface KernelResult {
  /**
   * Completed conversation produced during the execution.
   *
   * The collection includes the initial messages, assistant turns, and tool
   * results appended by the kernel.
   */
  readonly conversation: readonly LLMMessage[]

  /**
   * Identifier used to correlate the execution across agents, tools, logs, and
   * telemetry.
   */
  readonly executionId: string

  /**
   * Final turn produced by the agent.
   *
   * A successful execution normally completes with text content and a completed
   * stop reason rather than pending tool requests.
   */
  readonly finalTurn: AgentTurn

  /**
   * Number of agent turns requested during the execution.
   *
   * Tool execution does not increment this value independently. One iteration
   * corresponds to one call to {@link Agent.nextTurn}.
   */
  readonly iterationCount: number

  /**
   * Total token usage accumulated across every agent turn.
   */
  readonly usage: TokenUsage
}
