// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common';

import OpenAI from 'openai';
import type {
    ChatCompletionCreateParams,
    ChatCompletionMessage,
    ChatCompletionMessageParam,
    ChatCompletionTool,
} from 'openai/resources/chat/completions';

import { OpenAIProvider } from '@/llm/provider/llm-provider';
import type {
    LLM,
    LLMResponseFormat,
    LLMToolDefinition
} from '@/llm/llm';
import {
    MessageRole,
    type LLMGenerateInput,
    type LlmChatResult,
    type LLMMessage,
    type LLMToolCall,
    type LLMToolMessage,
} from '@/llm/llm';
import {
    LLMModelNotSupportedError,
    LLMMessageRoleNotSupportedError,
    LLMResponseFormatNotSupportedError,
    LLMNoChoicesError,
    LLMToolCallNotSupportedError,
} from '@/llm/error/error';
import { OPENAI_API_KEY_TOKEN } from '@/llm/llm.tokens';

/**
 * OpenAI-backed implementation of {@link LLM} using the official `openai` SDK.
 *
 * Maps {@link LLMGenerateInput} to `chat.completions` and normalizes the response into
 * {@link LlmChatResult}.
 *
 * The API key is injected via {@link OPENAI_API_KEY_TOKEN} (resolved from env in {@link LLMModule}).
 */
@Injectable()
export class OpenAILLMClient implements LLM {
    // MARK: - Private properties

    private readonly client: OpenAI;

    /**
     * @param apiKey - OpenAI API key (from {@link OPENAI_API_KEY_TOKEN}).
     * @param openAiProvider - Routing / allowlist check before calling the API.
     */
    constructor(
        @Inject(OPENAI_API_KEY_TOKEN)
        apiKey: string,
        private readonly openAiProvider: OpenAIProvider,
    ) {
        this.client = new OpenAI({ apiKey });
    }

    /**
     * Generates a chat completion for the given input.
     * 
     * @param input - The input for the chat completion.
     * @returns The chat completion result.
     */
    async generate(input: LLMGenerateInput): Promise<LlmChatResult> {
        if (!this.openAiProvider.supports(input.model)) {
            throw new LLMModelNotSupportedError();
        }

        const messages = this.buildChatMessages(input);
        const tools = this.toChatTools(input.tools);
        const responseFormat = this.toChatResponseFormat(input.responseFormat);

        const completion = await this.client.chat.completions.create(
            {
                model: input.model,
                messages,
                temperature: input.temperature,
                max_tokens: input.maxOutputTokens,
                top_p: input.topP,
                stop: input.stopSequences,
                frequency_penalty: input.frequencyPenalty,
                presence_penalty: input.presencePenalty,
                tools: tools.length > 0 ? tools : undefined,
                tool_choice: this.toChatToolChoice(input.toolChoice),
                response_format: responseFormat,
            },
            { timeout: input.timeoutMs ?? undefined },
        );

        const choice = completion.choices[0];

        if (!choice) throw new LLMNoChoicesError();

        const message = choice.message;
        const toolCalls = this.toChatToolCalls(message.tool_calls);

        return {
            id: completion.id,
            content: message.content ?? '',
            model: completion.model,
            role: MessageRole.Assistant,
            toolCalls,
            toolResults: message.refusal ? { refusal: message.refusal } : {},
        };
    }

    // MARK: - Private methods

    private buildChatMessages(input: LLMGenerateInput): ChatCompletionMessageParam[] {
        const messages: LLMMessage[] = [];

        if (input.systemPrompt?.trim()) {
            messages.push({
                role: MessageRole.System,
                content: input.systemPrompt.trim(),
            });
        }

        messages.push(...input.messages);

        const hasUser = messages.some((message) => message.role === MessageRole.User);

        if (!hasUser) {
            messages.push({
                role: MessageRole.User,
                content: 'No user message provided',
            });
        }

        return messages.map((message) => this.toChatMessage(message));
    }

    private toChatMessage(message: LLMMessage): ChatCompletionMessageParam {
        switch (message.role) {
            case MessageRole.System:
                return { role: 'system', content: message.content };

            case MessageRole.User:
                return { role: 'user', content: message.content };

            case MessageRole.Assistant:
                return { role: 'assistant', content: message.content };

            case MessageRole.Tool: {
                const tool = message as LLMToolMessage;
                return {
                    role: 'tool',
                    tool_call_id: tool.toolCallId,
                    content: tool.content,
                };
            }

            default:
                throw new LLMMessageRoleNotSupportedError();
        }
    }

    private toChatTools(tools: LLMToolDefinition[] | undefined): ChatCompletionTool[] {
        if (!tools?.length) return [];

        return tools.map((tool) => ({
            type: 'function' as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters as Record<string, unknown>,
            },
        }));
    }

    private toChatResponseFormat(
        responseFormat: LLMResponseFormat | undefined,
    ): ChatCompletionCreateParams['response_format'] {
        if (!responseFormat) return undefined;

        switch (responseFormat.type) {
            case 'text':
                return { type: 'text' };

            case 'json':
                return { type: 'json_object' };

            case 'json_schema':
                return {
                    type: 'json_schema',
                    json_schema: {
                        name: 'response',
                        schema: responseFormat.schema as Record<string, unknown>,
                        strict: true
                    }
                };
            default:
                throw new LLMResponseFormatNotSupportedError();
        }
    }

    private toChatToolChoice(
        toolChoice: LLMGenerateInput['toolChoice']
    ): ChatCompletionCreateParams['tool_choice'] | undefined {
        if (!toolChoice) return undefined;

        switch (toolChoice) {
            case 'auto':
                return 'auto';

            case 'required':
                return 'required';

            case 'none':
                return 'none';

            default:
                return { type: 'function', function: { name: toolChoice.name } };
        }
    }

    private toChatToolCalls(calls: ChatCompletionMessage['tool_calls']): LLMToolCall[] {
        if (!calls?.length) return [];

        return calls.map((toolCall) => {
            switch (toolCall.type) {
                case 'function':
                    return {
                        id: toolCall.id,
                        name: toolCall.function.name,
                        arguments: toolCall.function.arguments,
                        type: 'function' as const,
                    };

                case 'custom':
                    return {
                        id: toolCall.id,
                        name: toolCall.custom.name,
                        arguments: toolCall.custom.input,
                        type: 'function' as const,
                    };

                default:
                    throw new LLMToolCallNotSupportedError();
            }
        });
    }
}
