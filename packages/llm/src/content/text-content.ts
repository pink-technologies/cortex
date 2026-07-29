// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ContentKind } from './content-kind'

/**
 * Plain text segment inside {@link LLMMessage.content}.
 *
 * Discriminated by {@link ContentKind.Text}. Messages may include multiple text
 * blocks; provider adapters typically concatenate them in order when the vendor
 * API expects a single string, or preserve them as separate parts for
 * multimodal payloads.
 */
export interface TextContent {
  /**
   * UTF-8 text for this block.
   *
   * Empty strings are allowed but usually omitted by callers unless they need a
   * deliberate blank segment.
   */
  readonly text: string

  /** Discriminant; always {@link ContentKind.Text}. */
  readonly type: typeof ContentKind.Text
}
