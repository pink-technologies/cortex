// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from '@/i18n/i18n.service';
import {
  ConfirmSignupError,
  InvalidCodeError,
  InvalidCredentialsError,
  InvalidParametersError,
  InvalidPasswordError,
  NewPasswordRequiredError,
  UserIsNotConfirmedError,
} from '@/infraestructure/auth';

import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import type { Response } from 'express';

import {
  InactiveUserError,
  PendingUserConfirmationError,
  PhoneAlreadyRegisteredError,
  UnauthorizedError,
  UserAlreadyRegisteredError,
  UserNotFoundError,
} from '../services/error/authentication-service-error';

/**
 * Authentication-specific exception filter.
 *
 * This filter intercepts authentication- and persistence-related
 * exceptions and translates them into appropriate HTTP exceptions
 * with safe, user-facing messages.
 *
 * Responsibilities:
 * - map domain-level authentication errors to HTTP status codes,
 * - prevent leakage of provider or database implementation details,
 * - normalize error messages returned to API consumers,
 * - allow already-formed {@link HttpException} instances to pass through unchanged.
 *
 * Responses are written via {@link ArgumentsHost} (HTTP context) so the filter
 * ends the request in one place without re-throwing into Nest’s exception chain.
 *
 * This filter is intended to be used in the authentication boundary
 * (e.g. auth controllers or globally when auth errors may propagate).
 */
@Catch()
export class AuthenticationExceptionFilter implements ExceptionFilter {
  // MARK: - Constructor

  /**
   * Creates a new instance of the class.
   *
   * @param i18n - The internationalization service used to resolve
   * localized, user-facing messages in a consistent and
   * domain-aware manner.
   */
  constructor(private readonly i18n: I18nService) {}

  // MARK: - ExceptionFilter

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const i18n = this.i18n;

    if (exception instanceof ConfirmSignupError) {
      this.sendHttpError(
        response,
        new BadRequestException(i18n.authentication.confirmSignUpFailed(), { cause: exception }),
      );
      return;
    }

    if (exception instanceof InvalidParametersError || exception instanceof InvalidPasswordError) {
      this.sendHttpError(
        response,
        new BadRequestException(i18n.common.requestCouldNotBeProcessed(), { cause: exception }),
      );
      return;
    }

    if (exception instanceof NewPasswordRequiredError) {
      this.sendHttpError(
        response,
        new ForbiddenException(i18n.authentication.newPasswordRequired(), { cause: exception }),
      );
      return;
    }

    if (exception instanceof UserIsNotConfirmedError) {
      this.sendHttpError(
        response,
        new ForbiddenException(i18n.authentication.accountNotConfirmed(), { cause: exception }),
      );
      return;
    }

    if (exception instanceof InactiveUserError) {
      this.sendHttpError(
        response,
        new UnauthorizedException(i18n.authentication.inactiveUser(), { cause: exception }),
      );
      return;
    }

    if (exception instanceof PendingUserConfirmationError) {
      this.sendHttpError(
        response,
        new UnauthorizedException(i18n.authentication.verifyYourAccount(), { cause: exception }),
      );
      return;
    }

    if (exception instanceof PhoneAlreadyRegisteredError) {
      this.sendHttpError(
        response,
        new UnauthorizedException(i18n.authentication.phoneNumberAlreadyRegistered(), { cause: exception }),
      );
      return;
    }

    if (
      exception instanceof InvalidCodeError ||
      exception instanceof InvalidCredentialsError ||
      exception instanceof UnauthorizedError
    ) {
      this.sendHttpError(
        response,
        new UnauthorizedException(i18n.authentication.invalidCredentials(), {
          cause: exception,
        }),
      );
      return;
    }

    if (exception instanceof UserAlreadyRegisteredError) {
      this.sendHttpError(
        response,
        new UnauthorizedException(i18n.authentication.userAlreadyExists(), { cause: exception }),
      );
      return;
    }

    if (exception instanceof UserNotFoundError) {
      this.sendHttpError(
        response,
        new UnauthorizedException(i18n.authentication.userNotFound(), { cause: exception }),
      );
      return;
    }

    if (exception instanceof HttpException) {
      this.sendHttpError(response, exception);
      return;
    }

    this.sendHttpError(
      response,
      new InternalServerErrorException(i18n.common.serviceUnavailable(), { cause: exception }),
    );
  }

  // MARK: - Private Methods

  private sendHttpError(response: Response, httpException: HttpException): void {
    response.status(httpException.getStatus()).json(httpException.getResponse());
  }
}
