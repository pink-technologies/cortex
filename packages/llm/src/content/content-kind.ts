// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Canonical discriminants for multimodal blocks inside
 * {@link LLMMessage.content}.
 *
 * Use these constants when constructing {@link Content} variants or switching
 * on `content.type` in provider mappers:
 *
 * - `Text` (`text`) — plain text via {@link TextContent}.
 * - `Image` (`image`) — inline or referenced image via {@link ImageContent}.
 * - `ToolUse` (`tool_use`) — model-requested tool call via {@link ToolUseContent}.
 * - `ToolResult` (`tool_result`) — tool output returned to the model via
 *   {@link ToolResultContent}.
 *
 * Wire values are lowercase snake_case so they stay stable across LLM providers
 * even when local property names use PascalCase.
 */
export const ContentKind = {
  /** Inline or referenced image block ({@link ImageContent}). */
  Image: 'image',

  /** Plain text segment ({@link TextContent}). */
  Text: 'text',

  /** Model-requested tool invocation ({@link ToolUseContent}). */
  ToolUse: 'tool_use',

  /** Tool execution result for the model context ({@link ToolResultContent}). */
  ToolResult: 'tool_result',
} as const

/**
 * Discriminant string for a {@link Content} block.
 *
 * Derived from {@link ContentKind} so runtime comparisons and the TypeScript
 * union remain synchronized.
 */
export type ContentKind = (typeof ContentKind)[keyof typeof ContentKind]
