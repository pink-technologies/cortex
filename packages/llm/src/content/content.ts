// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { type ImageContent } from "./image-content"
import { type TextContent } from "./text-content"
import { type ToolResultContent } from "./tool-result-content"
import { type ToolUseContent } from "./tool-use-content"

/**
 * A single multimodal block inside {@link LLMMessage.content}.
 *
 * Discriminated by {@link ContentKind} via each variant's `type` field:
 *
 * - {@link TextContent} — plain text (`text`)
 * - {@link ImageContent} — inline or referenced image (`image`)
 * - {@link ToolUseContent} — model-requested tool call (`tool_use`)
 * - {@link ToolResultContent} — tool output for the model (`tool_result`)
 *
 * Provider mappers should switch on `content.type` rather than structural
 * guessing so new block kinds fail loudly at compile time.
 */
export type Content =
  | TextContent
  | ImageContent
  | ToolUseContent
  | ToolResultContent
