// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { OpenAILLM } from '../../src/provider/openai/openai-llm'
import { LLMFactoryImpl } from '../../src/provider/llm-provider'
import { LLMProviderType, type LLMProviderType as LLMProviderTypeId } from '../../src/provider/llm-provider-type'

describe('LLM factory', () => {
  describe('Given the OpenAI provider type', () => {
    describe('When creating an LLM client', () => {
      it('Then returns an OpenAILLM instance', () => {
        const factory = new LLMFactoryImpl()

        const llm = factory.create(LLMProviderType.OpenAI, {
          apiKey: 'test-key',
        })

        expect(llm).toBeInstanceOf(OpenAILLM)
      })
    })
  })

  describe('Given an unsupported provider type', () => {
    describe('When creating an LLM client', () => {
      it('Then rejects with an unsupported provider error', () => {
        const factory = new LLMFactoryImpl()
        const unsupportedProvider = 'anthropic' as LLMProviderTypeId

        expect(() =>
          factory.create(unsupportedProvider, {
            apiKey: 'test-key',
          }),
        ).toThrow('Unsupported provider: anthropic')
      })
    })
  })
})
