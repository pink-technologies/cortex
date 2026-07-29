// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ContentKind } from "./content-kind"

/**
 * Outcome of running a tool the model previously requested.
 *
 * Discriminated by {@link ContentKind.ToolResult}. Provider adapters map this
 * block to vendor-specific tool-result messages (for example Anthropic
 * `tool_result` or OpenAI `role: "tool"`). Must pair with the originating
 * {@link ToolUseContent} through {@link toolUseId}.
 */
export interface ToolResultContent {
  /**
   * Serialized tool output for the model context.
   *
   * Prefer plain text or JSON stringification. When {@link isError} is true,
   * this should still carry a human- or model-readable failure description.
   */
  readonly content: string

  /**
   * Whether the tool run failed without aborting the conversation.
   *
   * When `true`, adapters may mark the vendor payload as an error while still
   * delivering {@link content} to the model. Omit or set `false` for success.
   */
  readonly isError?: boolean

  /**
   * Identifier of the originating tool call.
   *
   * Must equal {@link ToolUseContent.id} from the assistant turn that requested
   * the tool.
   */
  readonly toolUseId: string

  /** Discriminant; always {@link ContentKind.ToolResult}. */
  readonly type: typeof ContentKind.ToolResult
}
