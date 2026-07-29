// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Canonical reasons a language-model completion stopped generating.
 *
 * Returned on {@link LLMResponse.stopReason}. Provider adapters map
 * vendor-specific values (for example OpenAI `finish_reason`: `stop`,
 * `length`, `tool_calls`, `content_filter`) onto these identifiers so callers
 * can branch without depending on provider APIs.
 *
 * Use these constants when comparing or assigning stop reasons:
 *
 * - `completed` — Natural end of generation (provider `stop` / end_turn).
 * - `content_filtered` — Output blocked or omitted by a safety filter.
 * - `maximum_output_tokens_reached` — Hit max output / length limit.
 * - `tool_use` — Stopped to invoke one or more tools (`tool_calls`).
 * - `unknown` — Unrecognized or missing vendor finish reason.
 *
 * Wire values are lowercase snake_case for stable serialization across
 * manifests, logs, and APIs.
 */
export const LLMStopReason = {
  Completed: 'completed',
  ContentFiltered: 'content_filtered',
  MaximumOutputTokensReached: 'maximum_output_tokens_reached',
  ToolUse: 'tool_use',
  Unknown: 'unknown',
} as const

/**
 * Supported normalized stop-reason identifier.
 *
 * Derived from {@link LLMStopReason} so runtime comparisons and the TypeScript
 * union remain synchronized.
 */
export type LLMStopReason = (typeof LLMStopReason)[keyof typeof LLMStopReason]
