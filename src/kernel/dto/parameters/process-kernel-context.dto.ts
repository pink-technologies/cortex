// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SourceType } from '@/kernel/types/source-type';

/**
 * Request context for kernel process (HTTP boundary; validated by the global {@link ValidationPipe}).
 *
 * When `origin` is `chat`, `chatId` is required.
 * When `origin` is `webhook`, `externalProvider` and `eventType` are typically required.
 */
export class ProcessKernelContextDto {
    /**
     * The source that originated the kernel input.
     */
    @IsEnum(SourceType, { message: 'origin must be "chat" or "webhook".' })
    origin: SourceType;

    /**
     * The identifier of the chat. Required when origin is `chat`.
     */
    @IsOptional()
    @IsString()
    chatId?: string;

    /**
     * Optional intent hint used to resolve the target agent.
     */
    @IsOptional()
    @IsString()
    intent?: string;

    /**
     * External provider name (e.g. github, jira, stripe, slack). Used when origin is `webhook`.
     */
    @IsOptional()
    @IsString()
    externalProvider?: string;

    /**
     * Provider-specific event type (e.g. pull_request, invoice.paid). Used when origin is `webhook`.
     */
    @IsOptional()
    @IsString()
    eventType?: string;

    /**
     * Optional provider-side reference (e.g. issue key, PR number). Used when origin is `webhook`.
     */
    @IsOptional()
    @IsString()
    externalReference?: string;
}
