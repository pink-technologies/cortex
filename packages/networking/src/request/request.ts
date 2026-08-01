// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { z } from 'zod'
import {
  NetworkingConnectionError,
  NetworkingError,
  NetworkingRequestCancelledError,
  NetworkingResponseSerializationError,
  NetworkingResponseValidationError,
} from '../error/error'
import { HTTPHeaders } from '../headers/http-headers'
import type { Middleware } from '../middleware/middleware'
import type { Monitor } from '../monitor/monitor'
import { NetworkResponse } from '../response/network-response'
import { validateResponse, type ValidateOptions } from '../response/validators'
import { JsonSerializer } from '../serializer/json-serializer'
import type { Serializer } from '../serializer/serializer'
import { TextSerializer } from '../serializer/text-serializer'
import type { URLRequest } from './url-request'

/**
 * Dependencies injected into {@link Request}.
 */
export interface RequestContext {
  readonly fetchImpl: typeof fetch
  readonly middleware: Middleware
  readonly monitor: Monitor
  readonly request: URLRequest
}

/**
 * Fluent HTTP request that wraps `fetch`.
 *
 * HTTP status / content-type checks run only when {@link validate} is chained;
 * serialization always runs afterward. When validation is enabled and the
 * response is unacceptable after retries are exhausted, serialization methods
 * reject with {@link NetworkingResponseValidationError}.
 */
export class Request {
  // MARK: - Properties

  private readonly context: RequestContext
  private readonly abortController: AbortController
  private validateOptions: ValidateOptions | undefined
  private lastHeaders = new HTTPHeaders()
  private lastStatusCode = 0

  // MARK: - Constructor

  /**
   * @param context - Session-provided dependencies and built request.
   */
  constructor(context: RequestContext) {
    this.context = context
    this.abortController = new AbortController()

    if (context.request.signal) {
      if (context.request.signal.aborted) {
        this.abortController.abort(context.request.signal.reason)
      } else {
        context.request.signal.addEventListener(
          'abort',
          () => this.abortController.abort(context.request.signal?.reason),
          { once: true },
        )
      }
    }
  }

  // MARK: - Instance methods

  /**
   * Enables status / content-type validation before serialization.
   *
   * Validation is opt-in: if this method is not called, the response is
   * serialized without HTTP status or content-type checks. When enabled and
   * the response is unacceptable after retries are exhausted, the subsequent
   * serialization call rejects with {@link NetworkingResponseValidationError}.
   *
   * @param options - Validation options (default: 2xx).
   * @returns This request for chaining.
   */
  validate(options?: ValidateOptions): this {
    this.validateOptions = options ?? {}
    return this
  }

  /**
   * Executes the request and returns UTF-8 text.
   *
   * @returns Network response with string success value.
   * @throws {@link NetworkingResponseValidationError} when {@link validate} was
   *   used and the response is unacceptable after retries.
   */
  serializingText(): Promise<NetworkResponse<string, NetworkingError>> {
    return this.serializingWith(new TextSerializer())
  }

  /**
   * Executes the request and parses JSON without schema validation.
   *
   * @returns Network response with parsed JSON.
   * @throws {@link NetworkingResponseValidationError} when {@link validate} was
   *   used and the response is unacceptable after retries.
   */
  serializingJson<T = unknown>(): Promise<NetworkResponse<T, NetworkingError>> {
    return this.serializingWith(new JsonSerializer<T>())
  }

  /**
   * Executes the request, parses JSON, and validates with a Zod schema.
   *
   * @param schema - Zod schema applied to the parsed value.
   * @returns Network response with validated data.
   * @throws {@link NetworkingResponseValidationError} when {@link validate} was
   *   used and the response is unacceptable after retries.
   */
  serializing<T>(schema: z.ZodType<T>): Promise<NetworkResponse<T, NetworkingError>> {
    return this.serializingWith(new JsonSerializer(schema))
  }

  /**
   * Executes with a custom serializer.
   *
   * Connection, cancellation, adaptation, and serialization failures resolve to
   * a failed {@link NetworkResponse}. When {@link validate} was used and status
   * / content-type checks fail after retries are exhausted, this method rejects
   * with {@link NetworkingResponseValidationError}.
   *
   * @param serializer - Serializer implementation.
   * @returns Network response with serializer output.
   * @throws {@link NetworkingResponseValidationError} when validation fails
   *   after retries.
   */
  async serializingWith<T>(
    serializer: Serializer<T>,
  ): Promise<NetworkResponse<T, NetworkingError>> {
    let retryCount = 0
    let adapted: URLRequest

    try {
      adapted = await this.adaptRequest()
    } catch (error) {
      return this.failureResponse(this.context.request, this.toNetworkingError(error))
    }

    for (;;) {
      try {
        return await this.perform(adapted, serializer)
      } catch (error) {
        const networkingError = this.toNetworkingError(error)

        if (networkingError instanceof NetworkingRequestCancelledError) {
          return this.failureResponse(adapted, networkingError)
        }

        let shouldRetry = false
        try {
          shouldRetry = await this.context.middleware.shouldRetry(
            adapted,
            networkingError,
            retryCount,
            this.abortController.signal,
          )
        } catch (retryError) {
          return this.failureResponse(adapted, this.toNetworkingError(retryError))
        }

        if (!shouldRetry) {
          if (networkingError instanceof NetworkingResponseValidationError) {
            this.notifyFail(adapted, networkingError)
            throw networkingError
          }

          return this.failureResponse(adapted, networkingError)
        }

        retryCount += 1
        try {
          adapted = await this.adaptRequest()
        } catch (adaptError) {
          return this.failureResponse(adapted, this.toNetworkingError(adaptError))
        }
      }
    }
  }

  /**
   * Cancels the in-flight request via its abort controller.
   */
  cancel(): void {
    this.abortController.abort(
      new NetworkingRequestCancelledError('Request cancelled'),
    )
  }

  // MARK: - Private methods

  private adaptRequest(): Promise<URLRequest> {
    return this.context.middleware.adapt({
      ...this.context.request,
      headers: this.context.request.headers.clone(),
      signal: this.abortController.signal,
    })
  }

  private toNetworkingError(error: unknown): NetworkingError {
    if (error instanceof NetworkingError) {
      return error
    }
    return new NetworkingConnectionError(
      error instanceof Error ? error.message : 'Request failed',
      { cause: error },
    )
  }

  private failureResponse<T>(
    request: URLRequest,
    error: NetworkingError,
  ): NetworkResponse<T, NetworkingError> {
    this.notifyFail(request, error)
    return new NetworkResponse(
      request,
      error.statusCode ?? this.lastStatusCode,
      this.lastHeaders.clone(),
      { ok: false, error },
    )
  }

  private notifyStart(request: URLRequest): void {
    try {
      this.context.monitor.requestDidStart?.(request)
    } catch {
      // Monitoring must not affect the request.
    }
  }

  private notifyComplete(request: URLRequest, statusCode: number): void {
    try {
      this.context.monitor.requestDidComplete?.(request, statusCode)
    } catch {
      // Monitoring must not affect the request.
    }
  }

  private notifyFail(request: URLRequest, error: NetworkingError): void {
    try {
      this.context.monitor.requestDidFail?.(request, error)
    } catch {
      // Monitoring must not affect the request.
    }
  }

  private async perform<T>(
    request: URLRequest,
    serializer: Serializer<T>,
  ): Promise<NetworkResponse<T, NetworkingError>> {
    if (this.abortController.signal.aborted) {
      throw new NetworkingRequestCancelledError('Request was cancelled', {
        cause: this.abortController.signal.reason,
      })
    }

    this.notifyStart(request)

    let response: globalThis.Response
    try {
      response = await this.context.fetchImpl(request.url, {
        body: request.body,
        headers: request.headers.toRecord(),
        method: request.method,
        signal: request.signal,
      })
    } catch (cause) {
      if (
        this.abortController.signal.aborted ||
        (cause instanceof Error && cause.name === 'AbortError')
      ) {
        throw new NetworkingRequestCancelledError('Request was cancelled', {
          cause,
        })
      }
      throw new NetworkingConnectionError(
        cause instanceof Error ? cause.message : 'fetch failed',
        { cause },
      )
    }

    const headers = new HTTPHeaders(response.headers)
    this.lastHeaders = headers
    this.lastStatusCode = response.status

    let buffer: Uint8Array
    try {
      buffer = new Uint8Array(await response.arrayBuffer())
    } catch (cause) {
      throw new NetworkingConnectionError(
        cause instanceof Error ? cause.message : 'Failed to read response body',
        { cause, statusCode: response.status },
      )
    }

    this.notifyComplete(request, response.status)

    if (this.validateOptions !== undefined) {
      validateResponse(
        {
          body: buffer,
          contentType: headers.get('content-type'),
          statusCode: response.status,
        },
        this.validateOptions,
      )
    }

    try {
      const value = await serializer.serialize(
        request,
        response.status,
        headers,
        buffer,
      )
      return new NetworkResponse(request, response.status, headers, {
        ok: true,
        value,
      })
    } catch (cause) {
      if (cause instanceof NetworkingError) {
        throw cause
      }
      throw new NetworkingResponseSerializationError(
        cause instanceof Error ? cause.message : 'Serialization failed',
        { cause, statusCode: response.status },
      )
    }
  }
}
