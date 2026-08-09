// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { LLMMessage, LLMToolDefinition } from '@cortex/llm'
import type { Agent } from '@/agent'

/**
 * Describes an execution request handled by the {@link Kernel}.
 *
 * The request identifies the executable agent, initial conversation, and tools
 * available during the execution. The kernel owns the mutable conversation
 * copy and repeatedly invokes the agent until it produces a final response or
 * an execution limit is reached.
 */
export interface KernelRequest {
  /**
   * Agent responsible for handling the execution.
   */
  readonly agent: Agent

  /**
   * Initial ordered conversation available to the agent.
   *
   * The kernel creates its own mutable snapshot and does not modify the
   * collection provided by the caller.
   */
  readonly messages: readonly LLMMessage[]

  /**
   * Tools available during the execution.
   *
   * The kernel exposes these definitions to the language model and must reject
   * any tool request whose name is not present in this collection.
   */
  readonly tools: readonly LLMToolDefinition[]
}
