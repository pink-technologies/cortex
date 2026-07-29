// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { LLMMessage } from '../message/llm-message'
import { LLMToolDefinition } from '../tool/llm-tool-definition'

/**
 * Provider-agnostic input for a single {@link LLM.complete} call.
 *
 * Carries the conversation transcript, model selection, optional tools, and
 * sampling / cancellation controls. Adapters (for example {@link OpenAILLM})
 * map these fields onto vendor request payloads so callers never depend on
 * SDK types.
 *
 * A successful call returns {@link LLMResponse}. Explicit aborts via
 * {@link signal} typically surface as {@link LLMRequestCancelledError};
 * exceeded {@link timeoutMilliseconds} as {@link LLMTimeoutError}.
 */
export interface LLMRequest {
  /**
   * Ordered conversation turns for this request.
   *
   * Each message may include multimodal {@link Content} blocks. Prefer
   * {@link systemPrompt} for system instructions instead of placing a system
   * role in this list (see {@link LLMMessageRole}).
   */
  readonly messages: readonly LLMMessage[]

  /**
   * Provider-specific model identifier for this request.
   *
   * Opaque vendor string (for example `gpt-4.1-mini` or
   * `claude-sonnet-4-20250514`). Validation of supported models is left to the
   * adapter or {@link LLMFactory} configuration.
   */
  readonly model: string

  /**
   * Abort signal used to cancel an in-flight request.
   *
   * When aborted, the adapter should terminate the underlying HTTP call and
   * fail with {@link LLMRequestCancelledError} (or an equivalent mapped error).
   */
  readonly signal?: AbortSignal

  /**
   * System-level instructions applied before the conversational transcript.
   *
   * Adapters typically emit this as a leading `system` message or a dedicated
   * system parameter, depending on the vendor API.
   */
  readonly systemPrompt?: string

  /**
   * Sampling temperature when the provider supports it.
   *
   * Higher values increase randomness; lower values favor more deterministic
   * completions. Exact range and defaults are provider-defined.
   */
  readonly temperature?: number

  /**
   * Soft upper bound on generated tokens for this completion.
   *
   * Mapped to the vendor's max-output / max-tokens field when supported (for
   * example OpenAI `max_tokens`).
   */
  readonly maxOutputTokens?: number

  /**
   * Maximum time allowed for the provider call, in milliseconds.
   *
   * When exceeded, the client should abort and surface
   * {@link LLMTimeoutError}. Distinct from {@link signal} cancellation.
   */
  readonly timeoutMilliseconds?: number

  /**
   * Tools the model may invoke during this request.
   *
   * When omitted or empty, tool use is disabled for the call. Each
   * {@link LLMToolDefinition.name} must match a runtime executor when the
   * response includes {@link ToolUseContent}.
   */
  readonly tools?: readonly LLMToolDefinition[]
}
