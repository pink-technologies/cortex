// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { HTTPHeaders } from '../headers/http-headers'
import type { URLRequest } from '../request/url-request'

/**
 * Converts a validated HTTP response body into a typed application value.
 *
 * Invoked by {@link Request} after transport success (and after
 * {@link validateResponse} when {@link Request.validate} was used).
 * Built-ins cover text and JSON; custom serializers plug in via
 * {@link Request.serializingWith}.
 *
 * Responsibilities:
 * - decode or parse `body` into {@link Output}
 * - throw a {@link NetworkingError} subclass on decode/parse/schema failure
 *
 * Non-goals:
 * - HTTP status / content-type checks (opt-in via {@link Request.validate})
 * - mutating the originating {@link URLRequest}
 */
export interface Serializer<Output> {
  /**
   * Deserializes the response body.
   *
   * @param request - Originating request (context for custom serializers).
   * @param statusCode - HTTP status from the transport response.
   * @param headers - Response headers.
   * @param body - Raw response body bytes.
   * @returns Deserialized value, or a promise of that value.
   * @throws {@link NetworkingResponseSerializationError} when deserialization fails.
   */
  serialize(
    request: URLRequest,
    statusCode: number,
    headers: HTTPHeaders,
    body: Uint8Array,
  ): Output | Promise<Output>
}
