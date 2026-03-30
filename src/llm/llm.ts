// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { LLMModel } from "./provider/llm-provider";


export const MessageRole = {
    Assistant: 'assistant',
    System: 'system',
    Tool: 'tool',
    User: 'user',
}

export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

export interface LLMSystemMessage {
    content: string;
    role: typeof MessageRole.System;
}

export interface LLMToolMessage {
    content: string;
    role: typeof MessageRole.Tool;
    toolCallId: string;
    toolName: string;
}

export type LLMMessage =
  | LLMSystemMessage
  | LLMToolMessage;

/**
 * Chat request: which provider/model to use plus the message list.
 *
 * **`provider`** is optional when the implementation is bound to one backend (e.g. only OpenAI);
 * pass it when using a router/facade that dispatches by provider.
 */
export interface LLMGenerateInput { 
    model: LLMModel;
    messages: LLMMessage[];
    systemPrompt?: string;
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    stopSequences?: string[];
    tools?: LLMTool[];
    toolChoice?: LLMToolChoice;
    responseFormat?: LLMResponseFormat;
    metadata?: Record<string, string>;
    conversationId?: string;
    requestId?: string;
    timeoutMs?: number;
}

/**
 * Provider-agnostic LLM port. Implementations wrap OpenAI, Anthropic, Ollama, etc.
 */
export interface LLM {
   
    generate(input: LLMGenerateInput): Promise<LlmChatResult>;
}
