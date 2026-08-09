// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { LLM } from '../client/llm'
import { OpenAILLM } from '../provider/openai/openai-llm'
import { LLMProviderType } from './llm-provider-type'

/**
 * Credentials and construction settings for a provider-backed {@link LLM}
 * client.
 *
 * Passed to {@link LLMFactory.create} alongside {@link LLMProviderType}.
 * Keep this limited to values needed at client construction time; per-request
 * options such as model and temperature belong on the chat/stream call.
 */
export type LLMProviderConfiguration = {
  /** API key used to authenticate with the selected provider. */
  readonly apiKey: string

  /** Provider type. */
  readonly provider: LLMProviderType
}

/**
 * Creates provider-backed {@link LLM} clients.
 *
 * Callers select a vendor with {@link LLMProviderType} and supply
 * {@link LLMProviderConfiguration}; the factory returns a ready-to-use
 * {@link LLM} without exposing provider SDKs.
 */
export interface LLMFactory {
  /**
   * Builds an {@link LLM} for the requested provider.
   *
   * @param type - Canonical provider identifier from {@link LLMProviderType}.
   * @param configuration - Credentials and construction settings.
   * @returns A provider-specific {@link LLM} implementation.
   * @throws {Error} When {@link type} has no registered implementation.
   */
  create(type: LLMProviderType, configuration: LLMProviderConfiguration): LLM
}

/**
 * Default {@link LLMFactory} that wires known Cortex LLM providers.
 *
 * Currently supports {@link LLMProviderType.OpenAI}. Additional vendors can be
 * registered as new switch cases without changing the public factory contract.
 */
export class LLMFactoryImpl implements LLMFactory {
  // MARK: - LLMFactory

  /**
   * Creates an {@link LLM} for the given provider type.
   *
   * @param type - Canonical provider identifier from {@link LLMProviderType}.
   * @param configuration - Credentials used to authenticate the provider client.
   * @returns A configured {@link LLM} instance.
   * @throws {Error} When the provider type has no registered implementation.
   */
  create(type: LLMProviderType, configuration: LLMProviderConfiguration): LLM {
    switch (type) {
      case LLMProviderType.OpenAI:
        return new OpenAILLM(configuration.apiKey)

      default:
        throw new Error(`Unsupported provider: ${type}`)
    }
  }
}
