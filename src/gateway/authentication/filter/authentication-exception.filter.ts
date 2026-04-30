// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from '@/i18n/i18n.service';
import { AuthenticatableError } from '@/infraestructure/auth';
import { sendErrorResponse } from '@/shared/filter/http-error-response';
import type { Response } from 'express';
import { AuthenticationServiceError } from '../services/error/authentication-service-error';
import { mapAuthenticationInfraException } from '../mapper/authentication-infra-error.mapper';
import { mapAuthenticationDomainException } from '../mapper/authentication-domain-error.mapper';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';

/**
 * Maps authentication domain and infrastructure errors to Nest HTTP exceptions
 * and writes the standard API error envelope (same serialization as the global filter).
 */
@Catch(AuthenticationServiceError, AuthenticatableError)
export class AuthenticationExceptionFilter implements ExceptionFilter {
  // MARK: - Constructor

  /**
   * Creates a new {@link AuthenticationExceptionFilter} instance.
   *
   * @param i18n - The internationalization service used to resolve
   * localized, user-facing messages in a consistent and
   * domain-aware manner.
   */
  constructor(private readonly i18n: I18nService) { }

  // MARK: - ExceptionFilter

  /**
   * Catches and handles authentication service and authenticatable errors.
   *
   * @param exception - The exception to catch.
   * @param host - The arguments host.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const httpException = this.toAuthenticationHttpException(exception, this.i18n);

    sendErrorResponse(response, httpException);
  }

  // MARK: - Private methods

  private toAuthenticationHttpException(
    exception: unknown,
    i18n: I18nService,
  ): HttpException {
    return (
      mapAuthenticationInfraException(exception, i18n) ??
      mapAuthenticationDomainException(exception, i18n) ?? 
      new InternalServerErrorException(i18n.common.serviceUnavailable(), {
        cause: exception,
      })
    );
  }
}
