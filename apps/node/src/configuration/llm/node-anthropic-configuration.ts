// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Host-owned Anthropic credentials used by a Cortex execution node.
 *
 * This configuration is supplied by the node host (typically from environment
 * or secret storage) and consumed when {@link NodeAgentLLMResolver} builds an
 * {@link LLMProviderConfiguration} for an Anthropic-backed language model. It
 * is not part of an agent manifest: model id, temperature, and other
 * agent-facing settings live on {@link AgentLLMDefinition}.
 *
 * Treat {@link apiKey} as sensitive. Do not log it, persist it in execution
 * results, or expose it through prompts, tool inputs, or agent definitions.
 */
export interface NodeAnthropicConfiguration {
  /** API key used to authenticate Anthropic requests. */
  readonly apiKey: string
}
