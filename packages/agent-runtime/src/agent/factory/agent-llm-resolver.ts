// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { LLM } from '@cortex/llm'
import type { AgentLLMDefinition } from '@/definition'

/**
 * Resolves the language-model client required by an agent.
 *
 * The resolver separates agent creation from provider credentials and client
 * configuration. Host applications are responsible for implementing this
 * contract using their configured secrets and LLM factory.
 */
export interface AgentLLMResolver {
  /**
   * Resolves a language-model client for the specified agent configuration.
   *
   * @param definition - Language-model configuration declared by the agent.
   * @returns The resolved language-model client.
   */
  resolve(definition: AgentLLMDefinition): Promise<LLM>
}
