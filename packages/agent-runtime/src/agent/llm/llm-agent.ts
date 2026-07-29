// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { LLM } from '@cortex/llm'
import type { AgentDefinition } from '../../definition'
import type { AgentExecutionContext } from '../context/agent-execution-context'
import type { Agent, AgentTurn, AgentTurnRequest } from '../models'
  
  /**
   * Produces agent turns using a language model.
   *
   * `LlmAgent` applies the static configuration declared by an
   * `AgentDefinition`, including its system prompt, model, temperature, and
   * maximum output token count.
   *
   * It does not execute tools or control the iterative agent loop. Those
   * responsibilities belong to the agent kernel.
   */
  export class LlmAgent implements Agent {
    // MARK: - Properties
  
    readonly definition: AgentDefinition
  
    // MARK: - Private Properties
  
    private readonly llm: LLM
  
    // MARK: - Computed Properties
  
    get id(): string {
      return this.definition.id
    }
  
    // MARK: - Constructor
  
    /**
     * Creates an LLM-backed agent.
     *
     * @param definition - Static configuration associated with the agent.
     * @param llm - Language-model client used to produce agent turns.
     */
    constructor(
      definition: AgentDefinition,
      llm: LLM,
    ) {
      this.definition = definition
      this.llm = llm
    }
  
    // MARK: - Agent
  
    async nextTurn(
      request: AgentTurnRequest,
      context: AgentExecutionContext,
    ): Promise<AgentTurn> {
      const response =
        await this.llm.complete({
          maxOutputTokens: this.definition.llm.maximumOutputTokens,
          messages: request.messages,
          model: this.definition.llm.model,
          signal: context.signal,
          systemPrompt: this.definition.descriptor.systemPrompt,
          temperature: this.definition.llm.temperature,
          tools: request.tools,
        })
  
      return {
        content: response.content,
        providerResponseId: response.providerResponseId,
        stopReason: response.stopReason,
        usage: response.usage,
      }
    }
  }