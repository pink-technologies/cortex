// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from "@/i18n/i18n.service";
import { RoleNotFound } from "../services/error/organization.error";
import { 
    HttpException,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";

/**
 * Maps an organization service error to an HTTP exception.
 *
 * @param exception - The organization service error to map.
 * @param i18n - The internationalization service used to resolve
 * localized, user-facing messages in a consistent and
 * domain-aware manner.
 * @returns An HTTP exception.
 */
export function toOrganizationHttpException(exception: unknown, i18n: I18nService): HttpException {
    if (exception instanceof RoleNotFound) {
        throw new NotFoundException(i18n.organizations.roleNotFound(), { cause: exception });
    }

    if (exception instanceof HttpException) {
        throw exception;
    }

    throw new InternalServerErrorException(i18n.common.serviceUnavailable(), { cause: exception });
}