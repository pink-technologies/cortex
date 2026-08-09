// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { WorkflowApprovalError, WorkflowCancelError, WorkflowModuleError } from '../error/error'
import type { Response } from 'express'
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common'

/**
 * Converts workflow domain failures into safe HTTP responses.
 *
 * Applied at the workflow controller boundary, this filter catches
 * {@link WorkflowModuleError} instances and terminates the Express response
 * with a sanitized payload.
 *
 * Mapping:
 * - {@link WorkflowApprovalError} → HTTP 409 (`Conflict`) — the run has no
 *   step awaiting approval (not reached, already decided, or terminal).
 * - {@link WorkflowCancelError} → HTTP 409 (`Conflict`) — the run is already
 *   terminal and cannot be cancelled.
 * - Any other {@link WorkflowModuleError} → HTTP 503 (`Service Unavailable`).
 *
 * Responsibilities:
 * - prevent repository and orchestration details from leaking to API clients,
 * - expose a stable, safe message,
 * - expose the machine-readable domain error `code` for client-side branching.
 */
@Catch(WorkflowModuleError)
export class WorkflowExceptionFilter implements ExceptionFilter {
  // MARK: - ExceptionFilter

  /**
   * Writes a sanitized HTTP response for a workflow domain failure.
   *
   * This method writes directly to the Express response instead of throwing an
   * additional Nest exception. Diagnostic causes are intentionally omitted
   * from the public payload.
   *
   * @param exception - Domain error raised while processing a workflow
   *   request; its {@link WorkflowModuleError.code} is safe to expose.
   * @param host - Nest execution context used to obtain the active Express
   *   response.
   */
  catch(exception: WorkflowModuleError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()

    if (exception instanceof WorkflowApprovalError || exception instanceof WorkflowCancelError) {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        code: exception.code,
        message: exception.message,
      })
      return
    }

    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      code: exception.code,
      message: 'Service unavailable',
    })
  }
}
