// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from '@/i18n/i18n.service';
import { UserNotFoundError, UserStatusUnchangedError } from '../service/error/user.error';
import {
    BadRequestException,
    Catch,
    ExceptionFilter,
    HttpException,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';

/**
 * User-specific exception filter.
 *
 * This filter intercepts user- and persistence-related
 * exceptions and translates them into appropriate HTTP exceptions
 * with safe, user-facing messages.
 *
 * Responsibilities:
 * - map domain-level user errors to HTTP status codes,
 * - prevent leakage of provider or database implementation details,
 * - normalize error messages returned to API consumers,
 * - allow already-formed {@link HttpException} instances to pass through unchanged.
 *
 * This filter is intended to be used in the user boundary
 * (e.g. user controllers or globally when user errors may propagate).
 */
@Catch()
export class UserExceptionFilter implements ExceptionFilter {
    // MARK: - Constructor

    /**
     * Creates a new instance of the class.
     *
     * @param i18n - The internationalization service used to resolve
     * localized, user-facing messages in a consistent and
     * domain-aware manner.
     */
    constructor(private readonly i18n: I18nService) { }

    // MARK: - ExceptionFilter

    catch(exception: unknown) {
        const i18n = this.i18n;

        if (exception instanceof UserNotFoundError) {
            throw new NotFoundException(i18n.user.userNotFound(), { cause: exception });
        }

        if (exception instanceof UserStatusUnchangedError) {
            throw new BadRequestException(i18n.user.userStatusUnchanged(), { cause: exception });
        }

        if (exception instanceof HttpException) {
            throw exception;
        }

        throw new InternalServerErrorException(i18n.common.serviceUnavailable(), { cause: exception });
    }
}
