// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { Content } from '../content/content'
import type { LLMMessageRole } from './llm-message-role'

/**
 * One turn in a provider-agnostic conversation transcript.
 *
 * Appears in {@link LLMRequest.messages} as an ordered list of prior and
 * current turns. Each message pairs a {@link LLMMessageRole} with multimodal
 * {@link Content} blocks. Provider adapters map this shape onto vendor message
 * APIs without exposing SDK types to callers.
 *
 * System instructions belong on {@link LLMRequest.systemPrompt}, not as a
 * message in this list.
 */
export interface LLMMessage {
  /**
   * Ordered multimodal body for this turn.
   *
   * Typical combinations:
   * - {@link LLMMessageRole.User} — {@link TextContent} and/or {@link ImageContent}
   * - {@link LLMMessageRole.Assistant} — {@link TextContent} and/or {@link ToolUseContent}
   * - {@link LLMMessageRole.Tool} — {@link ToolResultContent} (and related tool payload)
   *
   * Switch on each block's `type` ({@link ContentKind}) rather than assuming a
   * single text string.
   */
  readonly content: readonly Content[]

  /**
   * Who produced this turn (`user`, `assistant`, or `tool`).
   *
   * See {@link LLMMessageRole}.
   */
  readonly role: LLMMessageRole
}
