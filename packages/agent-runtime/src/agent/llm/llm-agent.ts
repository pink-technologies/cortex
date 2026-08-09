// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { LLM } from '@cortex/llm'
import type { AgentDefinition } from '@/definition'
import type { AgentExecutionContext } from '@/execution/agent-execution-context'
import type { Agent, AgentTurn, AgentTurnRequest } from '@/agent/models'

/**
 * {@link Agent} implementation that produces turns via a language-model client.
 *
 * Combines a static {@link AgentDefinition} with an injected {@link LLM}:
 * definition fields supply system prompt, model, temperature, and max output
 * tokens; each {@link nextTurn} call maps {@link AgentTurnRequest} plus
 * {@link AgentExecutionContext.signal} onto {@link LLM.complete}.
 *
 * This class does not execute tools, mutate conversation history, enforce
 * safety policy, or drive the multi-turn loop—those belong to the agent kernel.
 * Prefer constructing instances through the agent factory rather than wiring
 * definition and LLM by hand.
 */
export class LlmAgent implements Agent {
  // MARK: - Private Properties

  private readonly llm: LLM

  // MARK: - Properties

  /**
   * Manifest-backed configuration for this agent (descriptor, LLM settings,
   * execution limits, and safety policy).
   */
  readonly definition: AgentDefinition

  // MARK: - Computed Properties

  /**
   * Stable agent identifier; always equals {@link definition.id}.
   */
  get id(): string {
    return this.definition.id
  }

  // MARK: - Constructor

  /**
   * Creates an LLM-backed agent.
   *
   * @param definition - Static configuration loaded from the agent manifest.
   * @param llm - Provider client used for {@link LLM.complete} (typically from
   *   {@link LLMFactory} with credentials resolved at run time).
   */
  constructor(definition: AgentDefinition, llm: LLM) {
    this.definition = definition
    this.llm = llm
  }

  // MARK: - Agent

  /**
   * Runs one non-streaming completion for the current conversation turn.
   *
   * Builds an {@link LLMRequest} from:
   * - `messages` / `tools` on {@link request}
   * - model, temperature, max tokens, and system prompt on {@link definition}
   * - abort {@link AgentExecutionContext.signal} on {@link context}
   *
   * The returned {@link AgentTurn} is the normalized {@link LLMResponse}
   * (content blocks, stop reason, usage). The kernel interprets tool-use
   * blocks and continues the loop when needed.
   *
   * @param request - Conversation history and tools exposed for this turn.
   * @param context - Per-execution id and cancellation signal.
   * @returns The model completion for this turn.
   * @throws {LLMError} When the underlying {@link LLM.complete} call fails.
   */
  async nextTurn(request: AgentTurnRequest, context: AgentExecutionContext): Promise<AgentTurn> {
    return await this.llm.complete({
      maxOutputTokens: this.definition.llm.maximumOutputTokens,
      messages: request.messages,
      model: this.definition.llm.model,
      signal: context.signal,
      systemPrompt: this.definition.descriptor.systemPrompt,
      temperature: this.definition.llm.temperature,
      tools: request.tools,
    })
  }
}