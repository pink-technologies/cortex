// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from '@/i18n/i18n.service';
import {
  AuthenticatableError,
  ConfirmSignupError,
  InvalidCodeError,
  InvalidCredentialsError,
  InvalidParametersError,
  InvalidPasswordError,
  NewPasswordRequiredError,
  ProviderUserAlreadyExistsError,
  ProviderUserNotFoundError,
  UserIsNotConfirmedError,
} from '@/infraestructure/auth';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Maps infrastructure-layer auth errors (e.g. identity provider) to HTTP.
 *
 * @returns An {@link HttpException} when recognized; otherwise `null`.
 */
export function mapAuthenticationInfraException(
  exception: unknown,
  i18n: I18nService,
): HttpException | null {
  if (exception instanceof ConfirmSignupError) {
    return new BadRequestException(i18n.authentication.confirmSignUpFailed(), {
      cause: exception,
    });
  }

  if (
    exception instanceof InvalidParametersError ||
    exception instanceof InvalidPasswordError
  ) {
    return new BadRequestException(i18n.common.requestCouldNotBeProcessed(), {
      cause: exception,
    });
  }

  if (exception instanceof NewPasswordRequiredError) {
    return new ForbiddenException(i18n.authentication.newPasswordRequired(), {
      cause: exception,
    });
  }

  if (exception instanceof UserIsNotConfirmedError) {
    return new ForbiddenException(i18n.authentication.accountNotConfirmed(), {
      cause: exception,
    });
  }

  if (
    exception instanceof InvalidCodeError ||
    exception instanceof InvalidCredentialsError
  ) {
    return new UnauthorizedException(i18n.authentication.invalidCredentials(), {
      cause: exception,
    });
  }

  if (exception instanceof ProviderUserAlreadyExistsError) {
    return new UnauthorizedException(i18n.authentication.userAlreadyExists(), {
      cause: exception,
    });
  }

  if (exception instanceof ProviderUserNotFoundError) {
    return new UnauthorizedException(i18n.authentication.userNotFound(), {
      cause: exception,
    });
  }

  if (exception instanceof AuthenticatableError) {
    return new InternalServerErrorException(
      i18n.common.serviceUnavailable(),
      { cause: exception },
    );
  }

  return null;
}
