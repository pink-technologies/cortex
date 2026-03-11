// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
    BadRequestException,
    ArgumentsHost,
    Catch,
    ConflictException,
    ExceptionFilter,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { I18nService } from 'src/i18n';

/**
 * Global exception filter that maps Prisma errors to HTTP exceptions.
 *
 * Throws HttpException subclasses so NestJS returns correct status codes.
 * Re-throwing domain errors would bypass controller filters and result in 500.
 */
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class DatabaseExceptionFilter implements ExceptionFilter {
    constructor(private readonly i18n: I18nService) {}

    catch(exception: unknown, host: ArgumentsHost): void {
        if (exception instanceof Prisma.PrismaClientValidationError) {
            throw new BadRequestException(
                this.i18n.common.requestCouldNotBeProcessed(),
                { cause: exception },
            );
        }

        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            if (exception.code === 'P2002') {
                throw new ConflictException(
                    this.i18n.common.recordAlreadyExists(),
                    { cause: exception },
                );
            }

            if (exception.code === 'P2009') {
                throw new BadRequestException(
                    this.i18n.common.requestCouldNotBeProcessed(),
                    { cause: exception },
                );
            }

            if (exception.code === 'P2011' || exception.code === 'P2012') {
                throw new BadRequestException(
                    this.i18n.common.requestCouldNotBeProcessed(),
                    { cause: exception },
                );
            }

            if (exception.code === 'P2025') {
                throw new NotFoundException(
                    this.i18n.common.recordNotFound(),
                    { cause: exception },
                );
            }
        }

        throw new InternalServerErrorException(
            this.i18n.common.serviceUnavailable(),
            { cause: exception },
        );
    }
}