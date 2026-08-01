// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Canonical LLM vendor identifiers used when constructing clients via
 * {@link LLMFactory}.
 *
 * Use these constants when selecting a provider implementation:
 *
 * - `anthropic` — Anthropic Messages API.
 * - `openai` — OpenAI Chat Completions API.
 */
export const LLMProviderType = {
  Anthropic: 'anthropic',
  OpenAI: 'openai',
} as const

/**
 * Zod schema for {@link LLMProviderType} wire values.
 *
 * Accepts only the canonical vendor identifiers from {@link LLMProviderType}
 * (`anthropic`, `openai`). Use this when validating provider fields in agent
 * manifests, configuration, or API payloads so invalid vendors fail at parse
 * time instead of at client construction.
 */
export const LLMProviderTypeSchema = z.enum([
  LLMProviderType.Anthropic,
  LLMProviderType.OpenAI,
])

/**
 * Supported LLM provider identifier.
 *
 * Derived from {@link LLMProviderType} so runtime comparisons and the
 * TypeScript union remain synchronized.
 */
export type LLMProviderType = (typeof LLMProviderType)[keyof typeof LLMProviderType]