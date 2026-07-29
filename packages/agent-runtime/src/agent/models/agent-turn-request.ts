// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { LLMMessage, LLMToolDefinition } from '@cortex/llm'
  
  /**
   * Describes the input required by an agent to produce its next turn.
   *
   * The request contains the current conversation and the tools available during
   * this turn. Static agent configuration, such as the system prompt, model, and
   * temperature, is obtained from the agent definition.
   */
  export interface AgentTurnRequest {
    /**
     * Ordered conversation history available to the agent.
     *
     * The collection includes user, assistant, and tool-result messages from
     * previous turns. The agent must treat the collection as immutable.
     */
    readonly messages: readonly LLMMessage[]
  
    /**
     * Tools available to the agent during this turn.
     *
     * Exposing a tool to the language model does not bypass runtime
     * authorization. The kernel must still validate every requested tool before
     * executing it.
     */
    readonly tools: readonly LLMToolDefinition[]
  }