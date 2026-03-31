// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { InjectionToken } from '@nestjs/common';

import type { LLM } from './llm';
import type { LLMModel } from './provider/llm-provider';

/**
 * Nest DI token for the {@link LLM} port (the “ModelClient” / “LlmClient” in your docs:
 * execute prompts, talk to a vendor SDK, return {@link LlmChatResult}).
 *
 * Bind to {@link OpenAILLMClient} today; swap in another {@link LLM} implementation
 * (e.g. Anthropic) or a router provider later
 * without changing agents — they only depend on this token + the interface.
 */
export const LLM_TOKEN: InjectionToken<LLM> = Symbol('LLM');

/**
 * Resolved OpenAI API key string from env (see {@link LLMModule} factory).
 * Add sibling tokens (e.g. Anthropic) when you wire additional providers.
 */
export const OPENAI_API_KEY_TOKEN: InjectionToken<string> = Symbol('OPENAI_API_KEY');

/**
 * Resolved default chat model id when callers do not override (e.g. agents). Wired in
 * {@link LLMModule} from the `LLM_DEFAULT_MODEL` environment variable (required).
 */
export const DEFAULT_LLM_MODEL_TOKEN: InjectionToken<LLMModel> =
    Symbol('DEFAULT_LLM_MODEL');
