// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from '../../i18n';
import { 
  ToolAlreadyRegisteredError, 
  ToolNotFoundError, 
  ToolRequiredSlugError 
} from '../services/error/tool.error';

import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

/**
 * Tool-specific exception filter.
 *
 * This filter intercepts tool service domain exceptions and translates them
 * into appropriate HTTP exceptions with safe, user-facing messages.
 *
 * Responsibilities:
 * - map domain-level tool errors to HTTP status codes,
 * - prevent leakage of provider or implementation details,
 * - normalize error messages returned to API consumers,
 * - allow already-formed {@link HttpException} instances to pass through unchanged.
 *
 * This filter is intended to be used in the tool boundary
 * (e.g. tools controller or globally when tool errors may propagate).
 */
@Catch(
  HttpException,
  ToolAlreadyRegisteredError,  
  ToolNotFoundError,
  ToolRequiredSlugError,
)
export class ToolServiceExceptionFilter implements ExceptionFilter {
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

  catch(exception: unknown): void {
    const i18n = this.i18n;

    if (exception instanceof ToolNotFoundError) {
      throw new NotFoundException(
        'Tool not found', {
        cause: exception,
      });
    }

    if (exception instanceof ToolRequiredSlugError) {
      throw new BadRequestException(
        'Tool slug is required', {
        cause: exception,
      });
    }

    if (exception instanceof ToolAlreadyRegisteredError) {
      throw new BadRequestException(
        'Tool already registered', {
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
