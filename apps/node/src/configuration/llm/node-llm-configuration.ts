// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { NodeAnthropicConfiguration } from './node-anthropic-configuration'
import type { NodeOpenAIConfiguration } from './node-openai-configuration'

/**
 * Aggregate host-owned language-model provider credentials for a Cortex node.
 *
 * Bundles optional per-vendor settings such as {@link NodeOpenAIConfiguration}
 * and {@link NodeAnthropicConfiguration}. {@link NodeAgentLLMResolver} reads
 * this bag when mapping an agent's {@link AgentLLMDefinition.provider} onto an
 * {@link LLMProviderConfiguration} for {@link LLMFactory}.
 *
 * Providers are optional because a node may enable only a subset of vendors.
 * A missing entry means that provider is unavailable on this host; requesting
 * it at runtime should fail closed (for example with
 * {@link NodeLLMProviderNotConfiguredError}).
 *
 * This object holds secrets only. Agent-facing model settings (model id,
 * temperature, max tokens) remain on {@link AgentLLMDefinition}. Never log
 * these credentials or expose them through prompts, tool inputs, agent
 * definitions, or execution results.
 */
export interface NodeLLMConfiguration {
  /**
   * Anthropic credentials for this node, when Anthropic is enabled.
   *
   * Omit when this node does not run Anthropic-backed agents.
   */
  readonly anthropic?: NodeAnthropicConfiguration

  /**
   * OpenAI credentials for this node, when OpenAI is enabled.
   *
   * Omit when this node does not run OpenAI-backed agents.
   */
  readonly openAI?: NodeOpenAIConfiguration
}
