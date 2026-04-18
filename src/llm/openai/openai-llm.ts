// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { LLM, LLMMessage, LLMOptions, LLMResponse, StreamEvent } from '@/llm/llm';
import { OpenAIProvider } from '@/llm/provider/llm-provider';
import OpenAI from 'openai';
import { 
    mapFromOpenAIChatCompletion,
    mapFromOpenAIError, 
    mapToOpenAIMessageList, 
    mapToOpenAITool 
} from './mappers/openai-mappers';

/**
 * OpenAI-backed implementation of {@link LLM} using the official `openai` SDK.
 *
 * Maps {@link LLMGenerateInput} to `chat.completions` and normalizes the response into
 * {@link LlmChatResult}.
 *
 * The API key is supplied as a constructor argument (typically from env via {@link LLMModule} factory).
 */
export class OpenAILLM implements LLM {
    // MARK: - Private properties

    private readonly client: OpenAI;

    // MARK: - Constructor

    /**
     * Builds the official SDK {@link OpenAI} client and stores provider + default model for {@link generate}.
     *
     * {@link LLMModule} constructs this via `useFactory`: API key from `OPENAI_API_KEY`, {@link OpenAIProvider}
     * for `supports(model)` allowlisting, and default model from {@link DEFAULT_LLM_MODEL_TOKEN}
     * (`LLM_DEFAULT_MODEL` in config).
     *
     * @param apiKey - Bearer credential passed to `new OpenAI({ apiKey })` (non-empty; validated in the module factory).     
     */
    constructor(apiKey: string) {
        this.client = new OpenAI({ apiKey });
    }

    // MARK: - LLM

     /**
     * Runs a single chat completion and returns the full result.
     *
     * @param messages - Conversation history and current turn, in order.
     * @param options - Model override, system prompt, sampling, tools, timeout, etc.
     * @returns Normalized {@link LLMResponse} including {@link LLMResponse.content} and {@link LLMResponse.usage}.
     * @throws On non-retryable API or adapter errors.
     */
     async chat(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse> {
        try {                        
            const chatCompletion = await this.client.chat.completions.create(
                {
                  model: options.model,
                  messages: mapToOpenAIMessageList(messages, options.systemPrompt),
                  max_tokens: options.maxOutputTokens,
                  stream: false,
                  temperature: options.temperature,
                  tools: options.tools ? options.tools.map(mapToOpenAITool) : undefined,
                },
                {
                    signal: options.abortSignal,
                    timeout: options.timeout,
                }
            )

            return mapFromOpenAIChatCompletion(chatCompletion)
        } catch (error) {
            throw mapFromOpenAIError(error)
        }
     }

     /**
      * Streams a chat completion as an async iterable of {@link StreamEvent}.
      *
      * @param messages - Same as {@link LLM.chat}.
      * @param options - Same as {@link LLM.chat}.
      * @returns Async iterable; on success the last event uses {@link StreamEventType.Done}, on failure {@link StreamEventType.Error}.
      */
     async *stream(messages: LLMMessage[], options: LLMOptions): AsyncIterable<StreamEvent> {
        throw new Error('Unimplemented');
     }
}