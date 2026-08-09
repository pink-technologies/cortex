//
// Copyright (c) 2026, PinkTech
// https://pink-tech.io/
//

import type { LLMProviderType } from '@cortex/llm'
  
  /**
   * Defines the language model configuration used by an agent.
   *
   * These values come from the agent manifest and are applied to every language
   * model request performed by the agent.
   */
  export interface AgentLLMDefinition {
    /**
     * Maximum number of tokens the language model may generate in one response.
     */
    readonly maximumOutputTokens: number
  
    /**
     * Identifier of the language model used by the agent.
     *
     * The value is interpreted by the configured language model provider.
     */
    readonly model: string
  
    /**
     * Language model provider used to create the agent's LLM client.
     */
    readonly provider: LLMProviderType
  
    /**
     * Sampling temperature applied to language model requests.
     *
     * Lower values generally produce more deterministic responses, while higher
     * values allow more variation.
     */
    readonly temperature: number
  }