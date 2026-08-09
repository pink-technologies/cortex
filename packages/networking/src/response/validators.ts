// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NetworkingResponseValidationError } from '../error/error'

/**
 * Criteria used by {@link validateResponse} before response serialization.
 *
 * Applied when a {@link Request} runs `.validate(...)`. Omitted fields use
 * defaults that accept any 2xx status and do not constrain `Content-Type`.
 */
export interface ValidateOptions {
  /**
   * HTTP status codes treated as successful.
   *
   * When omitted, every status in the inclusive range `200`–`299` is accepted.
   */
  readonly acceptableStatusCodes?: readonly number[]

  /**
   * Substrings matched against the response `Content-Type` (case-insensitive).
   *
   * When set and non-empty, the header must contain at least one candidate
   * (for example `application/json` matches `application/json; charset=utf-8`).
   * When omitted or empty, content type is not checked.
   */
  readonly acceptableContentTypes?: readonly string[]
}

/**
 * Transport-level response snapshot used for validation.
 *
 * Produced after `fetch` completes and before serializers run. Carries only
 * what validators need—status, optional content type, and raw body bytes for
 * error diagnostics.
 *
 * Distinct from the Fetch API `Response` and from {@link NetworkResponse}.
 */
export interface HTTPResponse {
  /**
   * Response body bytes (may be empty).
   */
  readonly body: Uint8Array

  /**
   * `Content-Type` header value when present.
   */
  readonly contentType?: string

  /**
   * HTTP status code from the transport response.
   */
  readonly statusCode: number
}

/**
 * Ensures a transport response meets status and optional content-type rules.
 *
 * Called by {@link Request} after the HTTP round-trip and before serialization.
 * On status failure, the body is decoded as UTF-8 text and attached to the
 * thrown error for caller diagnostics.
 *
 * @param response - Transport response to validate.
 * @param options - Acceptable statuses and content types; defaults accept 2xx.
 * @throws {@link NetworkingResponseValidationError} when status or content type
 *   is unacceptable.
 */
export function validateResponse(response: HTTPResponse, options: ValidateOptions = {}): void {
  const acceptable = options.acceptableStatusCodes ?? Array.from({ length: 100 }, (_, index) => 200 + index)

  if (!acceptable.includes(response.statusCode)) {
    const bodyText = new TextDecoder().decode(response.body)
    throw new NetworkingResponseValidationError(`Unacceptable status code: ${response.statusCode}`, {
      responseBody: bodyText,
      statusCode: response.statusCode,
    })
  }

  if (options.acceptableContentTypes && options.acceptableContentTypes.length > 0) {
    const contentType = (response.contentType ?? '').toLowerCase()
    const matched = options.acceptableContentTypes.some((candidate) => contentType.includes(candidate.toLowerCase()))
    
    if (!matched) {
      throw new NetworkingResponseValidationError(`Unacceptable content type: ${response.contentType ?? '(missing)'}`, {
        statusCode: response.statusCode,
      })
    }
  }
}
