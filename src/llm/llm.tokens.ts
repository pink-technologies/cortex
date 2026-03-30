// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { InjectionToken } from '@nestjs/common';

import type { LLM } from './llm';

/**
 * Nest DI token for the {@link LLM} port (the “ModelClient” / “LlmClient” in your docs:
 * execute prompts, talk to a vendor SDK, return {@link LlmChatResult}).
 *
 * Bind to {@link OpenAILLMClient} today; swap in another {@link LLM} implementation
 * (e.g. Anthropic) or a router provider later
 * without changing agents — they only depend on this token + the interface.
 */
export const LLM_TOKEN: InjectionToken<LLM> = Symbol('LLM');
