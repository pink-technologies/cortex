// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { LLM } from '../llm';
import { OpenAILLM } from '../openai/openai-llm';

export type LLMModel = string;

export const LLMProviderType = {
  anthropic: 'anthropic',
  openAI: 'apenAI',
} as const;

export type LLMProviderType = (typeof LLMProviderType)[keyof typeof LLMProviderType];

export interface LLMProvider {


  makeLLM(type: LLMProviderType, apiKey: string, model: LLMModel): LLM
}

export class LLMProviderImpl implements LLMProvider {

  // MARK: - LLMProvider
  
  makeLLM(type: LLMProviderType, apiKey: string): LLM {
    switch (type) {
      case LLMProviderType.openAI:
        return new OpenAILLM(apiKey)

      default:
        throw new Error(`Unsupported provider: ${type}`)
    }
  }
}