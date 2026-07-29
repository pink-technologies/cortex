// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Token accounting for a single language-model completion.
 *
 * Returned on {@link LLMResponse.usage}. Provider adapters map vendor fields
 * (for example OpenAI `prompt_tokens` / `completion_tokens`) into these
 * normalized names so callers can bill, rate-limit, or log without branching on
 * provider APIs.
 *
 * Counts are non-negative integers. When a vendor omits usage, adapters
 * typically report `0` rather than leaving fields undefined.
 */
export interface TokenUsage {
  /**
   * Tokens charged on the prompt / context side of the request.
   *
   * Includes system prompt, conversation messages, and tool definitions when
   * the provider bills them as input. Corresponds to names like
   * `prompt_tokens` or `input_tokens` on vendor responses.
   */
  readonly inputTokens: number

  /**
   * Tokens generated in the model completion.
   *
   * Includes assistant text and structured tool-call payloads when the
   * provider counts them as output. Corresponds to names like
   * `completion_tokens` or `output_tokens` on vendor responses.
   */
  readonly outputTokens: number
}
