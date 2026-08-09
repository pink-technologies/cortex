// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { LLMProviderTypeSchema } from '@cortex/llm'

/**
 * Validates the language-model block of an agent manifest (`llm`).
 *
 * Wire keys are snake_case to match manifest YAML/JSON. After loading, the
 * runtime maps this shape onto {@link AgentLLMDefinition} (camelCase) and
 * applies the values to every model request the agent makes.
 *
 * Unknown keys are rejected (`.strict()`). Provider identity is constrained by
 * {@link LLMProviderTypeSchema}; model id and sampling limits beyond these
 * schema rules remain provider-specific.
 */
export const agentLLMSchema = z
  .object({
    /**
     * Maximum number of tokens the model may generate in one response.
     *
     * Must be a positive integer. Mapped to
     * {@link AgentLLMDefinition.maximumOutputTokens}.
     */
    maximum_output_tokens: z
      .number()
      .int()
      .positive(),

    /**
     * Provider-specific model identifier (for example `gpt-4.1-mini` or
     * `claude-sonnet-4-20250514`).
     *
     * Non-empty after trim. Interpreted by the selected {@link provider};
     * this schema does not validate that the vendor supports the id.
     */
    model: z
      .string()
      .trim()
      .min(1),

    /**
     * LLM vendor used to construct the agent's client.
     *
     * Must be a {@link LLMProviderType} wire value (`anthropic` or `openai`).
     */
    provider:
      LLMProviderTypeSchema,

    /**
     * Sampling temperature applied to model requests.
     *
     * Must be a non-negative number. Lower values tend to be more
     * deterministic; higher values allow more variation. Upper bounds and
     * other vendor limits are enforced by the provider implementation, not
     * this schema.
     */
    temperature: z
      .number()
      .nonnegative(),
  })
  .strict()

/**
 * Parsed language-model configuration from an agent manifest's `llm` block.
 *
 * Inferred from {@link agentLLMSchema}. Prefer {@link AgentLLMDefinition} in
 * runtime code after the loader normalizes field names.
 */
export type AgentLLMManifest = z.infer<typeof agentLLMSchema>