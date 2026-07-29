// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import OpenAI from 'openai'
import { LLM, type LLMRequest, type LLMResponse } from '../../client'
import {
  mapFromOpenAIChatCompletion,
  mapFromOpenAIError,
  mapToOpenAIMessageList,
  mapToOpenAITool,
} from './mappers/openai-mappers'

/**
 * OpenAI Chat Completions adapter implementing {@link LLM}.
 *
 * Uses the official `openai` SDK. Callers pass a provider-agnostic
 * {@link LLMRequest}; this class maps it to `chat.completions.create`
 * (`stream: false`) and returns a normalized {@link LLMResponse} via
 * {@link mapFromOpenAIChatCompletion}.
 *
 * Message, tool, and error conversion live in `./mappers/openai-mappers`.
 * Prefer constructing instances through {@link LLMFactory} with
 * {@link LLMProviderType.OpenAI} rather than calling this class directly.
 */
export class OpenAILLM implements LLM {
  // MARK: - Private properties

  private readonly client: OpenAI

  // MARK: - Constructor

  /**
   * Creates an OpenAI-backed {@link LLM} client.
   *
   * @param apiKey - API key passed to `new OpenAI({ apiKey })`. Supplied by
   *   {@link LLMFactory} from {@link LLMProviderConfiguration.apiKey}.
   */
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  // MARK: - LLM

  /**
   * Runs a single non-streaming Chat Completions request.
   *
   * Maps {@link LLMRequest} fields onto the OpenAI API:
   * - `messages` / `systemPrompt` → {@link mapToOpenAIMessageList}
   * - `tools` → {@link mapToOpenAITool} (omitted when unset)
   * - `maxOutputTokens` → `max_tokens`
   * - `signal` / `timeoutMilliseconds` → request options
   *
   * Successful responses are normalized with
   * {@link mapFromOpenAIChatCompletion}. Failures are remapped through
   * {@link mapFromOpenAIError} into typed {@link LLMError} subclasses
   * (authentication, rate limit, timeout, cancellation, and others).
   *
   * @param request - Conversation, model, tools, and sampling controls.
   * @returns Normalized assistant completion for this turn.
   * @throws {LLMError} Domain error produced by {@link mapFromOpenAIError}.
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      const chatCompletion = await this.client.chat.completions.create(
        {
          model: request.model,
          messages: mapToOpenAIMessageList(
            request.messages,
            request.systemPrompt,
          ),
          max_tokens: request.maxOutputTokens,
          stream: false,
          temperature: request.temperature,
          tools: request.tools
            ? request.tools.map(mapToOpenAITool)
            : undefined,
        },
        {
          signal: request.signal,
          timeout: request.timeoutMilliseconds,
        },
      )

      return mapFromOpenAIChatCompletion(chatCompletion)
    } catch (error) {
      throw mapFromOpenAIError(error)
    }
  }
}
