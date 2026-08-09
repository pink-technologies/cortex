// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NetworkingParameterEncodingError } from '../error/error'
import type { HTTPHeaders } from '../headers/http-headers'
import { HTTPMethod } from '../http/http-method'
import type { URLRequest } from '../request/url-request'

/**
 * Encodes parameters onto a {@link URLRequest}.
 */
export interface ParameterEncoder {
  /**
   * Applies parameters to the request (query and/or body).
   *
   * @param request - Mutable request.
   * @param parameters - JSON-serializable parameter map.
   * @throws {@link NetworkingParameterEncodingError} on encoding failure.
   */
  encode(request: URLRequest, parameters: Record<string, unknown>): void
}

/**
 * Encodes parameters as `application/x-www-form-urlencoded` query (GET/HEAD)
 * or body (other methods).
 *
 * This is the default {@link RequestBuilder} encoder when `parameters` is set
 * without an explicit `parameterEncoder`.
 */
export class URLEncodedParameterEncoder implements ParameterEncoder {
  // MARK: - Static properties

  /**
   * Shared encoder instance for URL-encoded parameters.
   */
  static readonly default = new URLEncodedParameterEncoder()

  // MARK: - Instance methods

  /**
   * @param request - Request to mutate.
   * @param parameters - Parameter map.
   * @throws {@link NetworkingParameterEncodingError} when URL construction fails.
   */
  encode(request: URLRequest, parameters: Record<string, unknown>): void {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(parameters)) {
      if (value === undefined || value === null) {
        continue
      }
      search.set(key, String(value))
    }

    const encoded = search.toString()
    if (!encoded) {
      return
    }

    const method = request.method.toUpperCase()
    if (method === HTTPMethod.GET || method === HTTPMethod.HEAD) {
      try {
        const url = new URL(request.url)
        for (const [key, value] of search.entries()) {
          url.searchParams.set(key, value)
        }
        request.url = url.href
      } catch (cause) {
        throw new NetworkingParameterEncodingError('Failed to encode URL parameters', {
          cause,
        })
      }
      return
    }

    request.headers.set('content-type', 'application/x-www-form-urlencoded')
    request.body = encoded
  }
}

/**
 * Encodes parameters as a JSON request body and sets `Content-Type`.
 *
 * Prefer this over manual `JSON.stringify` + `body` at Session call sites:
 *
 * ```ts
 * session.request(url, {
 *   method: HTTPMethod.POST,
 *   parameterEncoder: JSONParameterEncoder.default,
 *   parameters: { name: 'a' },
 * })
 * ```
 */
export class JSONParameterEncoder implements ParameterEncoder {
  // MARK: - Static properties

  /**
   * Shared encoder instance for JSON request bodies.
   */
  static readonly default = new JSONParameterEncoder()

  // MARK: - Instance methods

  /**
   * @param request - Request to mutate.
   * @param parameters - Parameter map.
   * @throws {@link NetworkingParameterEncodingError} when JSON serialization fails.
   */
  encode(request: URLRequest, parameters: Record<string, unknown>): void {
    try {
      request.body = JSON.stringify(parameters)
      request.headers.set('content-type', 'application/json')
    } catch (cause) {
      throw new NetworkingParameterEncodingError('Failed to encode JSON parameters', {
        cause,
      })
    }
  }
}

/**
 * Ensures `Content-Type` is present when a body is set without an explicit type.
 *
 * @param headers - Request headers.
 * @param fallback - Content type to apply when missing.
 */
export function ensureContentType(headers: HTTPHeaders, fallback: string): void {
  if (!headers.has('content-type')) {
    headers.set('content-type', fallback)
  }
}
