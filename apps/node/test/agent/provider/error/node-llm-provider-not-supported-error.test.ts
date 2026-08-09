// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { LLMProviderType } from '@cortex/llm'
import { NodeLLMProviderNotSupportedError } from '../../../../src/agent/provider/error/error'

describe('NodeLLMProviderNotSupportedError', () => {
  it('uses the expected error name', () => {
    const error = new NodeLLMProviderNotSupportedError(LLMProviderType.Anthropic)

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('NodeLLMProviderNotSupportedError')
  })

  it('stores the requested provider', () => {
    const error = new NodeLLMProviderNotSupportedError(LLMProviderType.Anthropic)

    expect(error.provider).toBe(LLMProviderType.Anthropic)
  })

  it('provides a meaningful message', () => {
    const error = new NodeLLMProviderNotSupportedError(LLMProviderType.Anthropic)

    expect(error.message).toContain(LLMProviderType.Anthropic)
    expect(error.code).toBe('NODE_LLM_PROVIDER_NOT_SUPPORTED')
  })
})
