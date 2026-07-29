// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Canonical roles for messages in a normalized {@link LLMMessage} transcript.
 *
 * Use these constants when building or comparing {@link LLMMessage.role}:
 *
 * - `assistant` — model-produced turns (text and/or tool calls).
 * - `tool` — tool execution results returned to the model (typically
 *   {@link ToolResultContent} blocks).
 * - `user` — human or application input (text, images, and related content).
 *
 * System instructions are not a message role here; supply them via
 * {@link LLMRequest.systemPrompt} so adapters can map them to each vendor’s
 * system channel. Wire values are lowercase to match common provider APIs.
 */
export const LLMMessageRole = {
  Assistant: 'assistant',
  Tool: 'tool',
  User: 'user',
} as const

/**
 * Supported normalized message role identifier.
 *
 * Derived from {@link LLMMessageRole} so runtime comparisons and the TypeScript
 * union remain synchronized.
 */
export type LLMMessageRole =
  (typeof LLMMessageRole)[keyof typeof LLMMessageRole]
