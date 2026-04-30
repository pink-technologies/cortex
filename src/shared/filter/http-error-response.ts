// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { Response } from 'express';
import { HttpException } from '@nestjs/common';

/**
 * Builds the API error body for an {@link HttpException}.
 *
 * Used by the global exception filter and any boundary-specific filters
 * that map domain failures to HTTP exceptions so the response shape stays
 * identical across modules.
 */
export function buildErrorPayload(
  exception: HttpException,
): Record<string, unknown> {
  const status = exception.getStatus();
  const body = exception.getResponse();

  if (typeof body === 'string') {
    return { statusCode: status, message: body };
  }

  return { statusCode: status, ...body };
}

/**
 * Sends an {@link HttpException} using the API error envelope.
 */
export function sendErrorResponse(
  response: Response,
  exception: HttpException,
): void {
  const status = exception.getStatus();

  response.status(status).send(buildErrorPayload(exception));
}
