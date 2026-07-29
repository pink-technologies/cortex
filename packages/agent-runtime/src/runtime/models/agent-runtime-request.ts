// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { LLMMessage } from '@cortex/llm'

/**
 * Caller-facing input to {@link AgentRuntime.execute}.
 *
 * This is the public execution contract above the kernel. The runtime resolves
 * {@link agentId} through {@link AgentDefinitionRegistry}, builds an executable
 * agent via {@link AgentFactory}, maps {@link toolNames} to
 * {@link LLMToolDefinition} entries through {@link AgentToolRegistry}, and
 * forwards the result as a {@link KernelRequest}.
 *
 * Unlike {@link KernelRequest}, callers identify the agent and tools by
 * stable registry keys rather than supplying executable instances or
 * language-model tool schemas directly.
 *
 * Cancellation, correlation, and wall-clock limits are not part of this
 * request; they are supplied separately on {@link AgentExecutionContext} and
 * the agent's {@link AgentDefinition.execution} settings.
 */
export interface AgentRuntimeRequest {
  /**
   * Stable identifier of the agent definition to execute.
   *
   * Must match a definition previously registered in
   * {@link AgentDefinitionRegistry}. The runtime resolves the definition and
   * creates a fresh executable agent for each call; it does not reuse agents
   * across executions. An unknown identifier surfaces as
   * {@link AgentDefinitionNotFoundError} during {@link AgentRuntime.execute}.
   */
  readonly agentId: string

  /**
   * Initial ordered conversation provided to the agent for this run.
   *
   * Typically starts with a user turn. Prior assistant or tool turns may be
   * included when resuming or continuing a conversation. System instructions
   * come from the agent definition's system prompt, not from a system message
   * in this list.
   *
   * The runtime and kernel treat this collection as immutable input: the
   * kernel copies it into an internal conversation snapshot and appends
   * assistant turns and tool results there without mutating the caller's
   * array.
   */
  readonly messages: readonly LLMMessage[]

  /**
   * Names of tools explicitly allowed for this execution (the tool allowlist).
   *
   * Each name must refer to a tool registered in {@link AgentToolRegistry}.
   * The runtime deduplicates names before resolving definitions, then exposes
   * only those tools to the language model. Tools that are registered but
   * absent from this list are not visible to the agent for the run.
   *
   * Pass an empty array to run without tools. Unknown names surface as
   * {@link AgentToolNotFoundError} while definitions are resolved. If the
   * model later requests a tool outside the resolved allowlist, the kernel
   * rejects it with {@link KernelToolNotAllowedError}.
   */
  readonly toolNames: readonly string[]
}
