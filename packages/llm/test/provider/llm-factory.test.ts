// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { OpenAILLM } from '../../src/provider/openai/openai-llm'
import { LLMFactoryImpl } from '../../src/provider/llm-provider'
import { LLMProviderType, type LLMProviderType as LLMProviderTypeId } from '../../src/provider/llm-provider-type'

jest.mock('../../src/provider/openai/openai-llm', () => ({
  OpenAILLM: jest.fn().mockImplementation(function OpenAILLM(this: { apiKey: string }, apiKey: string) {
    this.apiKey = apiKey
  }),
}))

describe('LLMFactoryImpl', () => {
  const OpenAILLMMock = OpenAILLM as unknown as jest.Mock

  beforeEach(() => {
    OpenAILLMMock.mockClear()
  })

  it('creates an OpenAI LLM for the OpenAI provider', () => {
    const factory = new LLMFactoryImpl()

    const llm = factory.create(LLMProviderType.OpenAI, {
      apiKey: 'test-key',
      provider: LLMProviderType.OpenAI,
    })

    expect(llm).toBeInstanceOf(OpenAILLM)
  })

  it('passes the API key to the OpenAI implementation', () => {
    const factory = new LLMFactoryImpl()

    factory.create(LLMProviderType.OpenAI, {
      apiKey: 'openai-secret',
      provider: LLMProviderType.OpenAI,
    })

    expect(OpenAILLMMock).toHaveBeenCalledWith('openai-secret')
  })

  it('throws when the provider has no implementation', () => {
    const factory = new LLMFactoryImpl()
    const unsupportedProvider = LLMProviderType.Anthropic as LLMProviderTypeId

    expect(() =>
      factory.create(unsupportedProvider, {
        apiKey: 'test-key',
        provider: unsupportedProvider,
      }),
    ).toThrow(`Unsupported provider: ${LLMProviderType.Anthropic}`)
  })
})
