// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import {
  SkillNotFoundError,
  SkillRequiredIdError,
  SkillRequiredNameError,
  SkillServiceError,
} from '../service/error/skills.error';

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
@Catch(SkillServiceError)
export class SkillServiceExceptionFilter implements ExceptionFilter {
  catch(exception: SkillServiceError, host: ArgumentsHost): void {
    if (exception instanceof SkillRequiredIdError) {
      throw new BadRequestException('Skill ID is required.', {
        cause: exception,
      });
    }

    if (exception instanceof SkillRequiredNameError) {
      throw new BadRequestException('Skill name is required.', {
        cause: exception,
      });
    }

    if (exception instanceof SkillNotFoundError) {
      throw new NotFoundException('Skill not found.', {
        cause: exception,
      });
    }

    throw new InternalServerErrorException(
      'An unexpected error occurred while processing the skill request.',
      {
        cause: exception,
      },
    );
  }
}