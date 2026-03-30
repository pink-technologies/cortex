// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OpenAILLMClient } from './client/openai/openai-llm.client';
import { OpenAIProvider } from './provider/llm-provider';
import { LLM_TOKEN } from './llm.tokens';

@Module({
    imports: [ConfigModule],
    providers: [
        OpenAIProvider,
        OpenAILLMClient,
        {
            provide: LLM_TOKEN,
            useExisting: OpenAILLMClient,
        },
    ],
    exports: [LLM_TOKEN, OpenAILLMClient, OpenAIProvider],
})
export class LLMModule { }