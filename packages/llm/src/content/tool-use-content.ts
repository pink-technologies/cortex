// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ContentKind } from "./content-kind"

/**
 * Model-initiated tool invocation inside {@link LLMMessage.content}.
 *
 * Discriminated by {@link ContentKind.ToolUse}. Provider adapters map this block
 * to vendor-specific shapes (for example Anthropic `tool_use` or OpenAI
 * `tool_calls`). A later {@link ToolResultContent} must reuse {@link id} as
 * `toolUseId` so the model can correlate request and result.
 */
export interface ToolUseContent {
  /**
   * Stable provider tool-call identifier.
   *
   * Returned results must set {@link ToolResultContent.toolUseId} to this value.
   */
  readonly id: string

  /**
   * Parsed JSON arguments supplied to the named tool.
   *
   * Adapters that receive stringified JSON from the provider should parse before
   * constructing this block.
   */
  readonly input: Record<string, unknown>

  /**
   * Registered tool name the model selected.
   *
   * Must match a tool exposed on the request (for example via
   * {@link LLMToolDefinition.name}).
   */
  readonly name: string

  /** Discriminant; always {@link ContentKind.ToolUse}. */
  readonly type: typeof ContentKind.ToolUse
}
