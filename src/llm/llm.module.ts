// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpenAILLM } from './openai/openai-llm';
import { LLMAPIKeyNotConfiguredError, LLMDefaultModelNotConfiguredError } from './error/error';

const OPENAI_API_KEY_ENV = 'OPENAI_API_KEY';
const LLM_DEFAULT_MODEL_ENV = 'LLM_DEFAULT_MODEL';

// TODO: Configuration Key for LLM is wrong here - need to fix it
// The model should be loaded and registered with their configurations
// Stored
@Module({
    imports: [ConfigModule],    
})
export class LLMModule {}