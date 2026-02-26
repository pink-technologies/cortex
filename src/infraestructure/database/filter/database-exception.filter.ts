// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
    DatabaseEntityConflictError,
    DatabaseInternalError,
    DatabaseInvalidQueryError,
    DatabaseMissingRequiredValueError
} from "../error/database-error";

export class DatabaseExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        if (exception instanceof Prisma.PrismaClientValidationError) {
            throw new DatabaseMissingRequiredValueError(
                'A required field is missing or contains a null value.',
                exception,
            );
        }

        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            if (exception.code === 'P2002') {
                throw new DatabaseEntityConflictError(
                    'A record with the same unique identifier already exists.',
                    exception,
                );
            }

            if (exception.code === 'P2009') {
                throw new DatabaseInvalidQueryError(
                    'The database query is invalid or malformed.',
                    exception
                );
            }

            if (exception.code === 'P2011' || exception.code === 'P2012') {
                throw new DatabaseMissingRequiredValueError(
                    'A required field is missing or contains a null value.',
                    exception,
                );
            }
        }

        throw new DatabaseInternalError('An unexpected database error occurred.', exception);
    }
}