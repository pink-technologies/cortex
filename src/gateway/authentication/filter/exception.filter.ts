// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from '@/i18n/i18n.service'
import { getExceptionCode } from '@/shared/utils/exception-code.util'
import {
  ChallengeRequiredError,
  ConfirmForgotPasswordError,
  ConfirmSignupError,
  DecodeTokenError,
  ForgotPasswordError,
  InvalidCodeError,
  InvalidCredentialsError,
  InvalidParametersError,
  InvalidPasswordError,
  NewPasswordRequiredError,
  RefreshTokenError,
  ResendConfirmationCodeError,
  SignInError,
  SignUpError,
  UserIsNotConfirmedError,
} from '@/infraestructure/auth/error/authenticatable-error'

import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'

import {
  InactiveUserError,
  PendingUserConfirmationError,
  PhoneAlreadyRegisteredError,
  UnauthorizedError,
  UserAlreadyRegisteredError,
  UserNotFoundError,
} from '../services/error/authentication-service-error'

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
 * This filter is intended to be used in the authentication boundary
 * (e.g. auth controllers or globally when auth errors may propagate).
 */
@Catch()
export class AuthenticationExceptionFilter implements ExceptionFilter {
  // MARK: - Constructor

  /**
   * Creates a new {@link AuthenticationExceptionFilter} instance.
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
  catch(exception: unknown, host: ArgumentsHost) {
    const i18n = this.i18n

    if (exception instanceof ConfirmSignupError) {
      throw new BadRequestException(
        {
          code: getExceptionCode(exception),
          message: i18n.authentication.confirmSignUpFailed(),
        },
        { cause: exception },
      )
    }

    if (exception instanceof ConfirmForgotPasswordError) {
      throw new BadRequestException(
        {
          code: getExceptionCode(exception),
          message: i18n.authentication.confirmForgotPasswordFailed(),
        },
        { cause: exception },
      )
    }

    if (exception instanceof SignUpError) {
      throw new BadRequestException(
        {
          code: getExceptionCode(exception),
          message: i18n.authentication.signupFailed(),
        },
        { cause: exception },
      )
    }

    if (
      exception instanceof InvalidParametersError ||
      exception instanceof InvalidPasswordError
    ) {
      throw new BadRequestException(
        {
          code: getExceptionCode(exception),
          message: i18n.common.requestCouldNotBeProcessed(),
        },
        { cause: exception },
      )
    }

    if (exception instanceof ForgotPasswordError) {
      throw new BadRequestException(
        {
          code: getExceptionCode(exception),
          message: i18n.common.requestCouldNotBeProcessed(),
        },
        { cause: exception },
      )
    }

    if (exception instanceof NewPasswordRequiredError) {
      throw new ForbiddenException(
        {
          code: getExceptionCode(exception),
          message: i18n.authentication.newPasswordRequired(),
        },
        { cause: exception },
      )
    }

    if (exception instanceof UserIsNotConfirmedError) {
      throw new ForbiddenException(
        {
          code: getExceptionCode(exception),
          message: i18n.authentication.accountNotConfirmed(),
        },
        { cause: exception },
      )
    }

    if (exception instanceof ChallengeRequiredError) {
      throw new ForbiddenException(
        {
          code: getExceptionCode(exception),
          message: i18n.authentication.additionalVerificationRequired(),
        },
        { cause: exception },
      )
    }

    if (exception instanceof InactiveUserError) {
      throw new UnauthorizedException(
        {
          code: getExceptionCode(exception),
          message: i18n.authentication.invalidCredentials(),
        },
        { cause: exception },
      )
    }

    if (exception instanceof PendingUserConfirmationError) {
      throw new UnauthorizedException(
        {
          code: getExceptionCode(exception),
          message: i18n.authentication.verifyYourAccount(),
        },
        { cause: exception },
      )
    }

    if (exception instanceof PhoneAlreadyRegisteredError) {
      throw new UnauthorizedException(
        {
          code: getExceptionCode(exception),
          message: i18n.authentication.phoneNumberAlreadyRegistered(),
        },
        { cause: exception },
      )
    }

    if (
      exception instanceof InvalidCodeError ||
      exception instanceof InvalidCredentialsError ||
      exception instanceof UnauthorizedError ||
      exception instanceof ResendConfirmationCodeError ||
      exception instanceof DecodeTokenError ||
      exception instanceof RefreshTokenError ||
      exception instanceof SignInError
    ) {
      throw new UnauthorizedException(
        {
          code: getExceptionCode(exception),
          message: i18n.authentication.invalidCredentials(),
        },
        { cause: exception },
      )
    }

    if (exception instanceof UserAlreadyRegisteredError) {
      throw new UnauthorizedException(
        {
          code: getExceptionCode(exception),
          message: i18n.authentication.userAlreadyExists(),
        },
        { cause: exception },
      )
    }

    if (exception instanceof UserNotFoundError) {
      throw new UnauthorizedException(
        {
          code: getExceptionCode(exception),
          message: i18n.authentication.userNotFound(),
        },
        { cause: exception },
      )
    }

    if (exception instanceof HttpException) {
      throw exception
    }

    throw new InternalServerErrorException(i18n.common.serviceUnavailable(), {
      cause: exception,
    })
  }
}
