// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { LLMModel } from './provider/llm-provider';

/**
 * String constants for OpenAI-style chat roles used in {@link LLMMessage} and
 * {@link LlmChatResult}.
 */
export const MessageRole = {
  /**
   * The assistant role.
   */
  Assistant: 'assistant',

  /**
   * The system role.
   */
  System: 'system',

  /**
   * The tool role.
   */
  Tool: 'tool',

  /**
   * The user role.
   */
  User: 'user',
} as const;

/** Union of literal role strings from {@link MessageRole}. */
export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

/**
 * A system-role message: high-priority instructions that steer the model for the request.
 */
export interface LLMSystemMessage {
  /**
   * The content of the system message.
   */
  content: string;

  /**
   * The role of the system message.
   */
  role: typeof MessageRole.System;
}

/**
 * A tool-role message: the result of running a tool the assistant asked for.
 */
export interface LLMToolMessage {
  /**
   * The content of the tool message.
   */
  content: string;

  /**
   * The role of the tool message.
   */
  role: typeof MessageRole.Tool;

  /**
   * The ID of the tool call.
   */
  toolCallId: string;

  /**
   * The name of the tool.
   */
  toolName: string;
}

/**
 * End-user or caller turn (chat history, current request, or a placeholder when only system
 * instructions are provided).
 */
export interface LLMUserMessage {
  /**
   * The content of the user message.
   */
  content: string;

  /**
   * The role of the user message.
   */
  role: typeof MessageRole.User;
}

/**
 * Prior assistant output in a multi-turn thread (replay for the next completion).
 */
export interface LLMAssistantMessage {
  /**
   * The content of the assistant message.
   */
  content: string;

  /**
   * The role of the assistant message.
   */
  role: typeof MessageRole.Assistant;
}

/**
 * A message in {@link LLMGenerateInput.messages}: system, user, assistant, and/or tool rows
 * for one {@link LLM.generate} call.
 *
 * **`LLMSystemMessage`** — merged with `systemPrompt` by adapters as needed.
 * **`LLMUserMessage`** / **`LLMAssistantMessage`** — multi-turn chat.
 * **`LLMToolMessage`** — tool execution result paired with a prior {@link LLMToolCall}.
 */
export type LLMMessage =
  | LLMSystemMessage
  | LLMUserMessage
  | LLMAssistantMessage
  | LLMToolMessage;

/**
 * Declares a function the model may call for this request (capabilities you expose).
 */
export interface LLMToolDefinition {
  /**
   * The name of the tool definition.
   */
  name: string;

  /**
   * The description of the tool definition.
   */
  description?: string;

  /**
   * The parameters of the tool definition.
   */
  parameters: Record<string, unknown>;
}

/**
 * One assistant-requested tool invocation, as emitted by the provider (e.g. OpenAI
 * `tool_calls` / function calls).
 */
export interface LLMToolCall {
  /**
   * The ID of the tool call.
   */
  id: string;

  /**
   * The name of the tool call.
   */
  name: string;

  /**
   * The arguments of the tool call.
   */
  arguments: string;

  /**
   * The type of the tool call.
   */
  type: 'function' | 'custom';

  /**
   * The index of the tool call.
   */
  index?: number;
}

/**
 * Controls whether and how the model may invoke tools from `LLMGenerateInput.tools`.
 */
export type LLMToolChoice = 'auto' | 'required' | 'none' | { name: string };

/**
 * Structured output mode for the assistant reply when the backend supports it.
 */
export type LLMResponseFormat =
  | { type: 'text' }
  | { type: 'json' }
  | { type: 'json_schema'; schema: unknown };

/**
 * Result of one {@link LLM.generate} call: assistant payload, tool activity, and trace
 * fields for logging or persistence.
 */
export interface LlmChatResult {
  /**
   * The ID of the result.
   */
  id: string;

  /**
   * The content of the result.
   */
  content: string;

  /**
   * The model of the result.
   */
  model: LLMModel;

  /**
   * The role of the result.
   */
  role: MessageRole;
  /**
   * The tool calls of the result.
   */
  toolCalls: LLMToolCall[];
  /**
   * The tool results of the result.
   */
  toolResults: Record<string, any>;
}

/**
 * Chat request: which provider/model to use plus the message list.
 */
export interface LLMGenerateInput {
  /**
   * The model to use.
   */
  model: LLMModel;

  /**
   * The messages to use.
   */
  messages: LLMMessage[];

  /**
   * The system prompt to use.
   */
  systemPrompt?: string;

  /**
   * The temperature to use.
   */
  temperature?: number;

  /**
   * The maximum output tokens to use.
   */
  maxOutputTokens?: number;

  /**
   * The top P to use.
   */
  topP?: number;

  /**
   * The stop sequences to use.
   */
  stopSequences?: string[];

  /**
   * The frequency penalty to use.
   */
  frequencyPenalty?: number;

  /**
   * The presence penalty to use.
   */
  presencePenalty?: number;

  /**
   * The tools to use.
   */
  tools?: LLMToolDefinition[];

  /**
   * The tool choice to use.
   */
  toolChoice?: LLMToolChoice;

  /**
   * The response format to use.
   */
  responseFormat?: LLMResponseFormat;

  /**
   * The metadata to use.
   */
  metadata?: Record<string, string>;

  /**
   * The conversation ID to use.
   */
  conversationId?: string;

  /**
   * The request ID to use.
   */
  requestId?: string;

  /**
   * The timeout to use.
   */
  timeoutMs?: number;
}

/**
 * Hexagonal-style port: domain and application code depend on this contract; adapters
 * implement it with concrete SDKs (OpenAI, Anthropic, Ollama, local runners, etc.).
 *
 * Use it from Nest services or use cases so HTTP clients, authentication, retries, and
 * vendor quirks stay behind one boundary. Callers work only with {@link LLMGenerateInput}
 * and {@link LlmChatResult}.
 */
export interface LLM {
  /**
   * Generate a chat response from the model.
   *
   * @param input - The input for the chat request.
   * @returns The result of the chat request.
   */
  generate(input: LLMGenerateInput): Promise<LlmChatResult>;
}
