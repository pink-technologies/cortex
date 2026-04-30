// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from '@/i18n/i18n.service';
import type { Response } from 'express';
import { sendErrorResponse } from './http-error-response';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

/**
 * Global exception filter responsible for handling all uncaught exceptions
 * across the application.
 *
 * This filter acts as the single, centralized layer for transforming
 * thrown exceptions into standardized HTTP responses.
 *
 * Behavior:
 * - Captures every exception not handled elsewhere in the request lifecycle.
 * - If the exception is an {@link HttpException}, it serializes it using the
 *   shared API error envelope ({@link sendErrorResponse}).
 * - Module-specific filters (e.g. authentication) map domain errors to
 *   {@link HttpException} first; this filter does not contain domain mapping.
 * - If the exception is unknown or not an {@link HttpException}, it returns
 *   a generic **500 Internal Server Error** response.
 *
 * Response standardization:
 * - Ensures all responses include a consistent structure.
 * - Prevents leaking internal implementation details.
 * - Provides localized fallback messages using {@link I18nService}.
 *
 * Security considerations:
 * - Avoids exposing sensitive internal errors.
 * - Returns generic messages for unexpected failures.
 *
 * This filter is intended to be registered at the application level
 * (global scope), ensuring consistent error handling across all modules.
 *
 * @see HttpException
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {

  // MARK: - Constructor

  /**
   * Creates a new {@link GlobalExceptionFilter} instance.
   *
   * @param i18n - The internationalization service used to resolve
   * localized, user-facing messages in a consistent and
   * domain-aware manner.
   */
  constructor(private readonly i18n: I18nService) {}

  // MARK: - ExceptionFilter

  /**
   * Catches and handles exceptions.
   *
   * @param exception - The exception to catch.
   * @param host - The arguments host.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      sendErrorResponse(response, exception);
      return;
    }

    response.status(status).send({
      statusCode: status,
      message: this.i18n.common.serviceUnavailable(),
    });
  }
}
