// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { URLEncodedParameterEncoder, type ParameterEncoder } from '../encoder/parameter-encoder'
import { HTTPHeaders } from '../headers/http-headers'
import { HTTPMethod } from '../http/http-method'
import { resolveURL, type URLConvertible } from '../http/url-convertible'
import type { URLRequest } from './url-request'

/**
 * Inputs used by {@link RequestBuilder} / {@link Session.request} to produce a
 * {@link URLRequest}.
 *
 * Prefer `parameters` + a {@link ParameterEncoder} for structured payloads.
 * Use `body` only when you already have a serialized {@link BodyInit}
 * (streams, multipart, pre-encoded buffers). When both are set, the encoder
 * runs after `body` is applied and may overwrite it.
 */
export interface RequestBuilderOptions {
  /**
   * Pre-serialized request body passed through to `fetch`.
   *
   * Prefer `parameters` with {@link JSONParameterEncoder} for JSON objects.
   * Leave unset for requests with no entity body.
   */
  readonly body?: BodyInit | null

  /**
   * Request headers as a plain record or {@link HTTPHeaders}.
   *
   * Records are wrapped in a new {@link HTTPHeaders} (names lowercased).
   * Encoders may add or replace headers such as `content-type`.
   */
  readonly headers?: Record<string, string> | HTTPHeaders

  /**
   * HTTP method for the request.
   *
   * Defaults to {@link HTTPMethod.GET} when omitted. Use {@link HTTPMethod}
   * constants at call sites instead of raw method strings.
   */
  readonly method?: HTTPMethod

  /**
   * Structured values applied by {@link parameterEncoder} before transport.
   *
   * With the default {@link URLEncodedParameterEncoder}: query string for
   * `GET` / `HEAD`, form body otherwise. Pass
   * {@link JSONParameterEncoder.default} for JSON request bodies.
   */
  readonly parameters?: Record<string, unknown>

  /**
   * Encoder that applies {@link parameters} to the built request.
   *
   * Defaults to {@link URLEncodedParameterEncoder.default} when `parameters`
   * is set. Ignored when `parameters` is omitted.
   */
  readonly parameterEncoder?: ParameterEncoder

  /**
   * Abort signal forwarded to `fetch` for cooperative cancellation.
   */
  readonly signal?: AbortSignal
}

/**
 * Assembles a {@link URLRequest} from a URL and {@link RequestBuilderOptions}.
 *
 * Used by {@link Session.request}; adapters typically do not call this type
 * directly. Resolves and validates the URL, normalizes headers, applies the
 * default method, then runs parameter encoding when `parameters` is present.
 */
export class RequestBuilder {
  // MARK: - Instance methods

  /**
   * Builds a transport-ready {@link URLRequest}.
   *
   * The URL must be absolute (`string` or {@link URL}). Method defaults to
   * {@link HTTPMethod.GET}. When `parameters` is provided, encoding uses
   * `parameterEncoder` or {@link URLEncodedParameterEncoder.default}.
   *
   * @param url - Absolute target URL as a string or {@link URL} instance.
   * @param options - Method, headers, body, parameters, encoder, and signal.
   * @returns Mutable {@link URLRequest} ready for middleware and `fetch`.
   * @throws {@link NetworkingInvalidURLError} when `url` is not a valid absolute URL.
   * @throws {@link NetworkingParameterEncodingError} when parameter encoding fails.
   */
  build(url: URLConvertible, options: RequestBuilderOptions = {}): URLRequest {
    const request: URLRequest = {
      body: options.body,
      headers: new HTTPHeaders(options.headers),
      method: options.method ?? HTTPMethod.GET,
      signal: options.signal,
      url: resolveURL(url),
    }

    if (options.parameters) {
      const encoder = options.parameterEncoder ?? URLEncodedParameterEncoder.default
      encoder.encode(request, options.parameters)
    }

    return request
  }
}
