// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Host-owned OpenAI credentials used by a Cortex execution node.
 *
 * This configuration is supplied by the node host (typically from environment
 * or secret storage) and consumed when {@link NodeAgentLLMResolver} builds an
 * {@link LLMProviderConfiguration} for {@link LLMProviderType.OpenAI}. It is
 * not part of an agent manifest: model id, temperature, and other agent-facing
 * settings live on {@link AgentLLMDefinition}.
 *
 * Treat {@link apiKey} as sensitive. Do not log it, persist it in execution
 * results, or expose it through prompts, tool inputs, or agent definitions.
 */
export interface NodeOpenAIConfiguration {
  /**
   * Secret used to authenticate requests to the OpenAI API.
   *
   * Passed through to {@link LLMFactory} / {@link OpenAILLM} when constructing
   * the provider client for this node. Must be a non-empty API key issued for
   * the OpenAI account this node is authorized to use.
   */
  readonly apiKey: string
}
