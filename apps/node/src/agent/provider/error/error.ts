// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { LLMProviderType } from '@cortex/llm'
import { NodeApplicationError } from '../../../error/error'

/**
 * Thrown when an agent requests a supported language-model provider that this
 * node has not configured.
 *
 * The provider is recognized by {@link NodeAgentLLMResolver}, but the matching
 * entry is missing from {@link NodeLLMConfiguration} (for example
 * {@link NodeLLMConfiguration.openAI} or {@link NodeLLMConfiguration.anthropic}
 * was omitted). Distinct from {@link NodeLLMProviderNotSupportedError}, which
 * means the provider itself is not implemented on this node.
 */
export class NodeLLMProviderNotConfiguredError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for unconfigured language-model provider errors.
   */
  readonly code = 'NODE_LLM_PROVIDER_NOT_CONFIGURED'

  /**
   * Provider identifier requested by the agent.
   */
  readonly provider: LLMProviderType

  // MARK: - Constructor

  /**
   * Creates an error describing an unconfigured language-model provider.
   *
   * @param provider - Provider identifier requested by the agent.
   * @param options - Optional error details, including the original cause.
   */
  constructor(provider: LLMProviderType, options?: ErrorOptions) {
    super(`Language-model provider not configured: ${provider}`, options)

    this.provider = provider
  }
}

/**
 * Thrown when an agent requests a language-model provider that this node does
 * not support.
 *
 * Raised for provider identifiers that {@link NodeAgentLLMResolver} does not
 * implement at all. Prefer {@link NodeLLMProviderNotConfiguredError} when the
 * provider is supported but host credentials are missing from
 * {@link NodeLLMConfiguration}.
 */
export class NodeLLMProviderNotSupportedError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for unsupported language-model provider errors.
   */
  readonly code = 'NODE_LLM_PROVIDER_NOT_SUPPORTED'

  /**
   * Provider identifier requested by the agent.
   */
  readonly provider: LLMProviderType

  // MARK: - Constructor

  /**
   * Creates an error describing an unsupported language-model provider.
   *
   * @param provider - Provider identifier requested by the agent.
   * @param options - Optional error details, including the original cause.
   */
  constructor(provider: LLMProviderType, options?: ErrorOptions) {
    super(`Language-model provider not supported: ${provider}`, options)

    this.provider = provider
  }
}
