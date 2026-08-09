// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { Response } from 'express'
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common'
import { NodeDisabledError, NodeModuleError, NodeNotFoundError, NodeRevokedError } from '../error/error'

/**
 * Converts execution-node domain failures into HTTP responses.
 *
 * The filter catches {@link NodeModuleError} instances at the node-controller
 * boundary and maps known lifecycle errors to client-facing status codes:
 *
 * - {@link NodeNotFoundError}: HTTP 404 (`Not Found`)
 * - {@link NodeDisabledError}: HTTP 403 (`Forbidden`)
 * - {@link NodeRevokedError}: HTTP 403 (`Forbidden`)
 * - all other node-module errors: HTTP 503 (`Service Unavailable`)
 *
 * Known domain errors expose their message and stable machine-readable `code`.
 * Unexpected operational errors receive the generic `"Service unavailable"`
 * message so persistence details and underlying causes are not leaked.
 *
 * Every response uses the following shape:
 * ```json
 * {
 *   "statusCode": 404,
 *   "code": "NODE_NOT_FOUND_ERROR",
 *   "message": "Execution node 2be34... not found"
 * }
 * ```
 */
@Catch(NodeModuleError)
export class NodeExceptionFilter implements ExceptionFilter {
  // MARK: - ExceptionFilter

  /**
   * Writes the HTTP response corresponding to an execution-node failure.
   *
   * This method writes directly to the active Express response. Known node
   * lifecycle errors preserve their public domain message, while all remaining
   * node-module errors are reduced to a generic service-unavailable response.
   *
   * @param exception - Domain error raised while processing an execution-node
   *   request. Its {@link NodeModuleError.code} is safe to expose.
   * @param host - Nest execution context used to obtain the active Express
   *   response.
   */
  catch(exception: NodeModuleError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()

    if (exception instanceof NodeNotFoundError) {
      response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        code: exception.code,
        message: exception.message,
      })
      return
    }

    if (exception instanceof NodeDisabledError) {
      response.status(HttpStatus.FORBIDDEN).json({
        statusCode: HttpStatus.FORBIDDEN,
        code: exception.code,
        message: exception.message,
      })
      return
    }

    if (exception instanceof NodeRevokedError) {
      response.status(HttpStatus.FORBIDDEN).json({
        statusCode: HttpStatus.FORBIDDEN,
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
