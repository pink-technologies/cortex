// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
    BadRequestException,
    Catch,
    ExceptionFilter,
    InternalServerErrorException,
    NotFoundException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { AgentNotFoundError } from '@/agents/service/error/agents.error';
import { ChatNotFoundError } from '@/chats/service/error/chat.error';
import {
    KernelChatRequiredIdError,
    KernelNoAgentsError,
    KernelOriginNotFoundError,
    KernelServiceError,
    WebhookProviderContextError,
    WebhookProviderNotFoundError,
} from '../service/error/kernel.error';
import { I18nService } from '@/i18n';

/**
 * Kernel exception filter.
 *
 * Maps kernel and related domain errors to appropriate HTTP exceptions.
 */
@Catch(
    KernelServiceError,
    AgentNotFoundError,
    ChatNotFoundError,
)
export class KernelExceptionFilter implements ExceptionFilter {
    constructor(private readonly i18n: I18nService) {}

    catch(exception: unknown, _host: unknown): never {
        if (exception instanceof KernelChatRequiredIdError) {
            throw new BadRequestException(
                this.i18n.common.requestCouldNotBeProcessed(),
                { cause: exception },
            );
        }

        if (exception instanceof KernelOriginNotFoundError) {
            throw new BadRequestException(
                this.i18n.common.requestCouldNotBeProcessed(),
                { cause: exception },
            );
        }

        if (exception instanceof KernelNoAgentsError) {
            throw new ServiceUnavailableException(
                this.i18n.common.serviceUnavailable(),
                { cause: exception },
            );
        }

        if (exception instanceof WebhookProviderNotFoundError) {
            throw new BadRequestException(
                this.i18n.common.requestCouldNotBeProcessed(),
                { cause: exception },
            );
        }

        if (exception instanceof WebhookProviderContextError) {
            throw new BadRequestException(
                this.i18n.common.requestCouldNotBeProcessed(),
                { cause: exception },
            );
        }

        if (exception instanceof AgentNotFoundError) {
            throw new NotFoundException(
                this.i18n.agents.agentNotFound(),
                { cause: exception },
            );
        }

        if (exception instanceof ChatNotFoundError) {
            throw new NotFoundException(
                this.i18n.chats.chatNotFound(),
                { cause: exception },
            );
        }

        throw new InternalServerErrorException(
            this.i18n.common.serviceUnavailable(),
            { cause: exception },
        );
    }
}
