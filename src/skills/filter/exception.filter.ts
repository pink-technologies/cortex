// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from '../../i18n';
import {
  SkillNotFoundError,
  SkillRequiredIdError,
  SkillRequiredNameError,
} from '../service/error/skills.error';
import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

/**
 * Skill-specific exception filter.
 *
 * This filter intercepts skill service domain exceptions and translates them
 * into appropriate HTTP exceptions with safe, user-facing messages.
 *
 * Responsibilities:
 * - map domain-level skill errors to HTTP status codes,
 * - prevent leakage of provider or implementation details,
 * - normalize error messages returned to API consumers,
 * - allow already-formed {@link HttpException} instances to pass through unchanged.
 *
 * This filter is intended to be used in the skill boundary
 * (e.g. skills controller or globally when skill errors may propagate).
 */
@Catch()
export class SkillServiceExceptionFilter implements ExceptionFilter {
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

    if (exception instanceof SkillRequiredIdError) {
      throw new BadRequestException(i18n.skills.skillRequiredId(), {
        cause: exception,
      });
    }

    if (exception instanceof SkillRequiredNameError) {
      throw new BadRequestException(i18n.skills.skillRequiredName(), {
        cause: exception,
      });
    }

    if (exception instanceof SkillNotFoundError) {
      throw new NotFoundException(i18n.skills.skillNotFound(), {
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
