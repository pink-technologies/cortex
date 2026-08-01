// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { z } from 'zod'
import { NetworkingResponseSerializationError } from '../error/error'
import type { HTTPHeaders } from '../headers/http-headers'
import type { URLRequest } from '../request/url-request'
import type { Serializer } from './serializer'

/**
 * {@link Serializer} that parses JSON and optionally validates with Zod.
 *
 * Used by {@link Request.serializingJson} (no schema) and
 * {@link Request.serializing} (schema required). When a schema is supplied it is
 * always applied to the parsed value—callers get validated {@link Output}, not
 * unchecked casts. Empty bodies parse as `null` before schema validation.
 *
 * @typeParam Output - Parsed (and optionally schema-validated) result type.
 */
export class JsonSerializer<Output = unknown> implements Serializer<Output> {
  // MARK: - Properties

  private readonly schema?: z.ZodType<Output>

  // MARK: - Constructor

  /**
   * @param schema - Optional Zod schema; when set, `safeParse` must succeed.
   */
  constructor(schema?: z.ZodType<Output>) {
    this.schema = schema
  }

  // MARK: - Serializer

  /**
   * @returns Parsed JSON, or schema-validated data when a schema was provided.
   * @throws {@link NetworkingResponseSerializationError} on parse or Zod failure.
   */
  serialize(
    _request: URLRequest,
    statusCode: number,
    _headers: HTTPHeaders,
    body: Uint8Array,
  ): Output {
    const text = new TextDecoder().decode(body)
    let parsed: unknown

    try {
      parsed = text.length === 0 ? null : JSON.parse(text)
    } catch (cause) {
      throw new NetworkingResponseSerializationError('Failed to parse JSON response', {
        cause,
        responseBody: text,
        statusCode,
      })
    }

    if (!this.schema) {
      return parsed as Output
    }

    const result = this.schema.safeParse(parsed)
    if (!result.success) {
      throw new NetworkingResponseSerializationError(
        'JSON response failed schema validation',
        { cause: result.error, responseBody: text, statusCode },
      )
    }

    return result.data
  }
}
