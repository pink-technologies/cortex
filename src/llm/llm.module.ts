// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { OpenAILLMClient } from './client/openai/openai-llm.client';
import {
    LLMAPIKeyNotConfiguredError,
    LLMDefaultModelNotConfiguredError,
} from './error/error';
import type { LLMModel } from './provider/llm-provider';
import { OpenAIProvider } from './provider/llm-provider';
import { DEFAULT_LLM_MODEL_TOKEN, LLM_TOKEN } from './llm.tokens';

const OPENAI_API_KEY_ENV = 'OPENAI_API_KEY';
const LLM_DEFAULT_MODEL_ENV = 'LLM_DEFAULT_MODEL';

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
            provide: OpenAILLMClient,
            inject: [ConfigService, OpenAIProvider, DEFAULT_LLM_MODEL_TOKEN],
            useFactory: (
                config: ConfigService,
                openAiProvider: OpenAIProvider,
                defaultModel: LLMModel,
            ): OpenAILLMClient => {
                const apiKey = config.get<string>(OPENAI_API_KEY_ENV)?.trim();
                if (!apiKey) {
                    throw new LLMAPIKeyNotConfiguredError();
                }
                return new OpenAILLMClient(apiKey, openAiProvider, defaultModel);
            },
        },
        {
            provide: LLM_TOKEN,
            useExisting: OpenAILLMClient,
        },
    ],
    exports: [
        LLM_TOKEN,
        DEFAULT_LLM_MODEL_TOKEN,
        OpenAILLMClient,
        OpenAIProvider,
    ],
})
export class LLMModule { }