// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { LLMResponse } from './llm-response'
import { LLMRequest } from './llm-request'

/**
 * Provider-agnostic port for a language-model client.
 *
 * Domain and agent-runtime code depend on this contract; concrete adapters
 * (OpenAI, Anthropic, and others) implement it with vendor SDKs. Callers never
 * import provider types—only {@link LLMRequest} in and {@link LLMResponse} out.
 *
 * Obtain instances via {@link LLMFactory} rather than constructing adapters
 * directly. Model ids on a request should be chosen from
 * {@link supportedModels} (or validated by the adapter if the list is open).
 */
export interface LLM {
  /**
   * Runs a single non-streaming completion for the given request.
   *
   * Implementations map {@link LLMRequest} onto the vendor API and normalize
   * the result to {@link LLMResponse} (content blocks, stop reason, usage).
   * Honors optional abort {@link LLMRequest.signal} and
   * {@link LLMRequest.timeoutMilliseconds} when provided.
   *
   * @param request - Conversation, model, tools, and sampling controls.
   * @returns Normalized assistant completion for this turn.
   * @throws On authentication, rate-limit, timeout, abort, or adapter errors
   *   (typically as typed errors from the LLM error module).
   */
  complete(request: LLMRequest): Promise<LLMResponse>
}
