// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { OpenAiErrorCode, OpenAILLMError } from '@/llm/openai/error/error';
import { I18nService } from '../../i18n';
import {
    BadRequestException,
    Catch,
    ExceptionFilter,
    HttpException,
    InternalServerErrorException,
} from '@nestjs/common';

/**
 * Chat-specific exception filter.
 *
 * This filter intercepts chat service domain exceptions and translates them
 * into appropriate HTTP exceptions with safe, user-facing messages.
 *
 * Responsibilities:
 * - map domain-level chat errors to HTTP status codes,
 * - prevent leakage of provider or implementation details,
 * - normalize error messages returned to API consumers,
 * - allow already-formed {@link HttpException} instances to pass through unchanged.
 *
 * This filter is intended to be used in the chat boundary
 * (e.g. chats controller or globally when chat errors may propagate).
 */
@Catch(
    HttpException,
    OpenAILLMError,
    BadRequestException,
    InternalServerErrorException,
)
export class PlaygroundExceptionFilter implements ExceptionFilter {
    // MARK: - Constructor

    /**
     * Creates a new {@link ChatsExceptionFilter}.
     *
     * @param i18n - The internationalization service used to resolve
     * localized, user-facing messages in a consistent and
     * domain-aware manner.
     */
    constructor(private readonly i18n: I18nService) { }

    // MARK: - ExceptionFilter

    catch(exception: unknown): void {
        const i18n = this.i18n;

        if ((exception as OpenAILLMError).code === OpenAiErrorCode.RATE_LIMIT_EXCEEDED) {
            throw new BadRequestException(i18n.common.rateLimitExceeded(), {
                cause: exception,
            });
        }

        if ((exception as OpenAILLMError).code === OpenAiErrorCode.JSON_RESPONSE_FORMAT) {
            throw new BadRequestException(i18n.common.jsonResponseFormatError(), {
                cause: exception,
            });
        }

        if ((exception as OpenAILLMError).code === OpenAiErrorCode.INSUFFICIENT_QUOTA) {
            throw new BadRequestException(i18n.common.insufficientQuota(), {
                cause: exception,
            });
        }

        if (exception instanceof HttpException) {
            throw exception;
        }

        throw new InternalServerErrorException(i18n.common.serviceUnavailable(), {
            cause: exception,
        });
    }
}
