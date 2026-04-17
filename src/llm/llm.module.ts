// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpenAILLM } from './openai/openai-llm';
import { LLMAPIKeyNotConfiguredError, LLMDefaultModelNotConfiguredError } from './error/error';
import type { LLMModel } from './provider/llm-provider';
import { OpenAIProvider } from './provider/llm-provider';
import { DEFAULT_LLM_MODEL_TOKEN, LLM_TOKEN } from './llm';

const OPENAI_API_KEY_ENV = 'OPENAI_API_KEY';
const LLM_DEFAULT_MODEL_ENV = 'LLM_DEFAULT_MODEL';

// TODO: Configuration Key for LLM is wrong here - need to fix it
// The model should be loaded and registered with their configurations
// Stored
@Module({
    imports: [ConfigModule],
    providers: [
        OpenAIProvider,
        {
            provide: DEFAULT_LLM_MODEL_TOKEN,
            inject: [ConfigService],
            useFactory: (config: ConfigService): LLMModel => {
                const raw = config.get<string>(LLM_DEFAULT_MODEL_ENV)?.trim();

                if (!raw) {
                    throw new LLMDefaultModelNotConfiguredError();
                }

                return raw;
            },
        },
        {
            provide: OpenAILLM,
            inject: [ConfigService],
            useFactory: (config: ConfigService): OpenAILLM => {
                const apiKey = config.get<string>(OPENAI_API_KEY_ENV)?.trim();
                
                if (!apiKey) {
                    throw new LLMAPIKeyNotConfiguredError();
                }

                return new OpenAILLM(apiKey);
            },
        },
        {
            provide: LLM_TOKEN,
            useExisting: OpenAILLM,
        },
    ],
    exports: [
        DEFAULT_LLM_MODEL_TOKEN,
        LLM_TOKEN,
        OpenAILLM,
        OpenAIProvider,
    ],
})
export class LLMModule {}