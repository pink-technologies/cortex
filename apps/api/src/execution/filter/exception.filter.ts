// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ExecutionJobError } from '../error/error'
import type { Response } from 'express'
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common'

/**
 * Converts execution-job domain failures into safe HTTP responses.
 *
 * Applied at the execution-job controller boundary, this filter catches
 * {@link ExecutionJobError} instances and terminates the Express response with
 * HTTP 503 (`Service Unavailable`).
 *
 * Responsibilities:
 * - prevent repository and orchestration details from leaking to API clients,
 * - expose a stable, safe `"Service unavailable"` message,
 * - expose the machine-readable domain error `code` for client-side branching,
 * - keep expected empty-queue outcomes separate from operational failures.
 *
 * Response body:
 * ```json
 * {
 *   "statusCode": 503,
 *   "code": "EXECUTION_JOB_CLAIM_ERROR",
 *   "message": "Service unavailable"
 * }
 * ```
 *
 * A normal claim result of `null` means no compatible job is available; it is
 * not an error and therefore does not pass through this filter.
 */
@Catch(ExecutionJobError)
export class ExecutionJobExceptionFilter implements ExceptionFilter {
  // MARK: - ExceptionFilter

  /**
   * Writes a sanitized HTTP 503 response for an execution-job domain failure.
   *
   * This method writes directly to the Express response instead of throwing an
   * additional Nest exception. The original error message and diagnostic cause
   * are intentionally omitted from the public payload.
   *
   * @param exception - Domain error raised while processing an execution-job
   *   request; its {@link ExecutionJobError.code} is safe to expose.
   * @param host - Nest execution context used to obtain the active Express
   *   response.
   */
  catch(exception: ExecutionJobError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()

    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      code: exception.code,
      message: 'Service unavailable',
    })
  }
}
