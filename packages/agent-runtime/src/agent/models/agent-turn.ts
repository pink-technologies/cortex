// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { LLMResponse } from '@cortex/llm'

/**
 * One non-streaming model completion produced during an executable agent run.
 *
 * Currently an alias of {@link LLMResponse}: content blocks, model id, stop
 * reason, and token usage for a single LLM call. Kept as a distinct agent-layer
 * name so callers can depend on turn semantics without coupling to the LLM
 * package, and so the shape can diverge later (for example attaching tool
 * outcomes or decision metadata) without renaming every call site.
 *
 * Streaming agent output is not represented here; use stream events from the
 * LLM client for incremental chunks.
 */
export type AgentTurn = LLMResponse
