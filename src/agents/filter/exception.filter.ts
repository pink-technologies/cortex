// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from '../../i18n';
import { SkillNotFoundError } from 'src/skills/service/error/skills.error';
import {
    AgentNotFoundError,
    AgentRequiredIdError,
    AgentRequiredNameError,
} from '../service/error/agents.error';
import {
    BadRequestException,
    Catch,
    ExceptionFilter,
    HttpException,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';

/**
 * Agents-specific exception filter.
 *
 * This filter intercepts agents service domain exceptions and translates them
 * into appropriate HTTP exceptions with safe, user-facing messages.
 *
 * Responsibilities:
 * - map domain-level agents errors to HTTP status codes,
 * - prevent leakage of provider or implementation details,
 * - normalize error messages returned to API consumers,
 * - allow already-formed {@link HttpException} instances to pass through unchanged.
 *
 * This filter is intended to be used in the agents boundary
 * (e.g. agents controller or globally when agents errors may propagate).
 */
@Catch(
    AgentNotFoundError,
    AgentRequiredIdError,
    AgentRequiredNameError,
    HttpException,
    SkillNotFoundError,
)
export class AgentsExceptionFilter implements ExceptionFilter {
    // MARK: - Constructor

    /**
     * Creates a new {@link AgentsExceptionFilter}.
     *
     * @param i18n - The underlying i18n provider used to
     * localized, user-facing messages in a consistent and
     * domain-aware manner.
     */
    constructor(private readonly i18n: I18nService) { }

    // MARK: - ExceptionFilter

    catch(exception: unknown): void {
        const i18n = this.i18n;

        if (exception instanceof AgentRequiredIdError) {
            throw new BadRequestException(i18n.agents.agentRequiredId(), {
                cause: exception,
            });
        }

        if (exception instanceof AgentRequiredNameError) {
            throw new BadRequestException(i18n.agents.agentRequiredName(), {
                cause: exception,
            });
        }

        if (exception instanceof AgentNotFoundError) {
            throw new NotFoundException(i18n.agents.agentNotFound(), {
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
