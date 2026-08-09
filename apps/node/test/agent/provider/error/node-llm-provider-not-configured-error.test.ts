// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { LLMProviderType } from '@cortex/llm'
import { NodeLLMProviderNotConfiguredError } from '../../../../src/agent/provider/error/error'

describe('NodeLLMProviderNotConfiguredError', () => {
  it('uses the expected error name', () => {
    const error = new NodeLLMProviderNotConfiguredError(LLMProviderType.OpenAI)

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('NodeLLMProviderNotConfiguredError')
  })

  it('stores the requested provider', () => {
    const error = new NodeLLMProviderNotConfiguredError(LLMProviderType.OpenAI)

    expect(error.provider).toBe(LLMProviderType.OpenAI)
  })

  it('provides a meaningful message', () => {
    const error = new NodeLLMProviderNotConfiguredError(LLMProviderType.OpenAI)

    expect(error.message).toContain(LLMProviderType.OpenAI)
    expect(error.code).toBe('NODE_LLM_PROVIDER_NOT_CONFIGURED')
  })
})
