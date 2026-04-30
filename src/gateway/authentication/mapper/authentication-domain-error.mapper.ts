// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from '@/i18n/i18n.service';
import { HttpException, UnauthorizedException } from '@nestjs/common';
import {
  InactiveUserError,
  PendingUserConfirmationError,
  PhoneAlreadyRegisteredError,
  UnauthorizedError,
  UserAlreadyRegisteredError,
  UserNotFoundError,
} from '../services/error/authentication-service-error';

/**
 * Maps gateway authentication domain errors to HTTP.
 *
 * @returns An {@link HttpException} when recognized; otherwise `null`.
 */
export function mapAuthenticationDomainException(
  exception: unknown,
  i18n: I18nService,
): HttpException | null {
  if (exception instanceof InactiveUserError) {
    return new UnauthorizedException(i18n.authentication.inactiveUser(), {
      cause: exception,
    });
  }

  if (exception instanceof PendingUserConfirmationError) {
    return new UnauthorizedException(i18n.authentication.verifyYourAccount(), {
      cause: exception,
    });
  }

  if (exception instanceof PhoneAlreadyRegisteredError) {
    return new UnauthorizedException(
      i18n.authentication.phoneNumberAlreadyRegistered(),
      { cause: exception },
    );
  }

  if (exception instanceof UnauthorizedError) {
    return new UnauthorizedException(i18n.authentication.invalidCredentials(), {
      cause: exception,
    });
  }

  if (exception instanceof UserAlreadyRegisteredError) {
    return new UnauthorizedException(i18n.authentication.userAlreadyExists(), {
      cause: exception,
    });
  }

  if (exception instanceof UserNotFoundError) {
    return new UnauthorizedException(i18n.authentication.userNotFound(), {
      cause: exception,
    });
  }

  return null;
}
