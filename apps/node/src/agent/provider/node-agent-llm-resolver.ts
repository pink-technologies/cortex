// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentLLMDefinition, AgentLLMResolver } from '@cortex/agent-runtime'
import type { LLM, LLMFactory, LLMProviderConfiguration } from '@cortex/llm'
import { LLMProviderType } from '@cortex/llm'
import { NodeLLMProviderNotConfiguredError, NodeLLMProviderNotSupportedError } from './error/error'
import { NodeLLMConfiguration } from '../../configuration'

/**
 * Resolves host-configured language-model implementations for agent executions.
 *
 * The resolver translates an agent's provider selection into host-owned
 * credentials and delegates provider construction to {@link LLMFactory}.
 */
export class NodeAgentLLMResolver implements AgentLLMResolver {
  // MARK: - Private Properties

  private readonly clients = new Map<LLMProviderType, Promise<LLM>>()

  // MARK: - Constructor

  /**
   * Creates a Node agent language-model resolver.
   *
   * @param configuration - Host-owned provider credentials and configuration.
   * @param factory - Factory used to create provider-specific implementations.
   */
  constructor(
    private readonly configuration: NodeLLMConfiguration,
    private readonly factory: LLMFactory,
  ) {}

  // MARK: - AgentLLMResolver

  /**
   * Resolves the language-model implementation required by an agent.
   *
   * Provider clients are created lazily and reused across executions.
   *
   * @param definition - Language-model definition declared by the agent.
   * @returns The resolved provider-independent language model.
   */
  async resolve(definition: AgentLLMDefinition): Promise<LLM> {
    const existingClient = this.clients.get(definition.provider)

    if (existingClient) {
      return existingClient
    }

    const clientPromise = (async (): Promise<LLM> => {
      const configuration = this.makeProviderConfiguration(definition.provider)

      return this.factory.create(definition.provider, configuration)
    })()

    this.clients.set(definition.provider, clientPromise)

    try {
      return await clientPromise
    } catch (error) {
      this.clients.delete(definition.provider)

      throw error
    }
  }

  // MARK: - Private methods
  
  private makeProviderConfiguration(provider: LLMProviderType): LLMProviderConfiguration {
    switch (provider) {
      case LLMProviderType.OpenAI:
        if (!this.configuration.openAI) {
          throw new NodeLLMProviderNotConfiguredError(LLMProviderType.OpenAI)
        }

        return {
          apiKey: this.configuration.openAI.apiKey,
          provider: LLMProviderType.OpenAI,
        }

      default:
        throw new NodeLLMProviderNotSupportedError(provider)
    }
  }
}
