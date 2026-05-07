// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from '@/i18n/i18n.service'
import { RoleNotFound } from '../../services/error/organization.error'
import { getExceptionCode } from '@/shared/utils/exception-code.util'
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

/**
 * Organization role-specific exception filter.
 *
 * This filter intercepts organization role- and persistence-related
 * exceptions and translates them into appropriate HTTP exceptions
 * with safe, user-facing messages.
 *
 * Responsibilities:
 * - map domain-level organization role errors to HTTP status codes,
 * - prevent leakage of provider or database implementation details,
 * - normalize error messages returned to API consumers,
 * - allow already-formed {@link HttpException} instances to pass through unchanged.
 *
 * This filter is intended to be used in the organization role boundary
 * (e.g. organization role controllers or globally when organization role errors may propagate).
 */
@Catch(RoleNotFound)
export class OrganizationRoleExceptionFilter implements ExceptionFilter {
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

  /**
   * Catches and handles exceptions.
   *
   * @param exception - The exception to catch.
   * @param host - The arguments host.
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const i18n = this.i18n

    if (exception instanceof RoleNotFound) {
      throw new NotFoundException(
        {
          code: getExceptionCode(exception),
          message: i18n.organizations.roleNotFound(),
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
