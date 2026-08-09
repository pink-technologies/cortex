// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { Agent } from '@/agent/models/agent'
import type { AgentDefinition } from '@/definition/models/agent-definition'
import type { AgentLLMResolver } from './agent-llm-resolver'
import { LlmAgent } from '@/agent/llm/llm-agent'

/**
 * Builds executable {@link Agent} instances from catalog {@link AgentDefinition}
 * records.
 *
 * Intentionally narrow: it does not load manifests from storage, pick the main
 * agent, or look up API keys. Callers supply a validated definition; this
 * factory asks {@link AgentLLMResolver} for an {@link LLM} client, then returns
 * an {@link LlmAgent}.
 *
 * Credential resolution and provider selection stay behind
 * {@link AgentLLMResolver} so the factory remains reusable across hosts.
 */
export class AgentFactory {
  // MARK: - Constructor

  /**
   * Creates an agent factory.
   *
   * @param llmResolver - Resolves a provider-backed {@link LLM} from
   *   {@link AgentDefinition.llm} (model/provider settings) plus host-supplied
   *   credentials. Injected by the application composition root.
   */
  constructor(private readonly llmResolver: AgentLLMResolver) {}

  // MARK: - Instance methods

  /**
   * Creates an {@link LlmAgent} for the given catalog definition.
   *
   * Resolves the language-model client via {@link AgentLLMResolver.resolve},
   * then wires it with {@link definition} into {@link LlmAgent}. The returned
   * agent is ready for {@link Agent.nextTurn}; it does not run the kernel loop.
   *
   * @param definition - Validated agent metadata and resolved system prompt.
   * @returns An executable {@link Agent} backed by the resolved {@link LLM}.
   */
  async create(definition: AgentDefinition): Promise<Agent> {
    const llm = await this.llmResolver.resolve(definition.llm)

    return new LlmAgent(definition, llm)
  }
}
