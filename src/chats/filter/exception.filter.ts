// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from '../../i18n';
import { ChatNotFoundError } from '../service/error/chat.error';
import {
    Catch,
    ExceptionFilter,
    HttpException,
    InternalServerErrorException,
    NotFoundException,
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
    ChatNotFoundError,
    HttpException,
)
export class ChatsExceptionFilter implements ExceptionFilter {
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

        if (exception instanceof ChatNotFoundError) {
            throw new NotFoundException(i18n.chats.chatNotFound(), {
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
