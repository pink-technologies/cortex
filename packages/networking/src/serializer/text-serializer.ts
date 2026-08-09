// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { HTTPHeaders } from '../headers/http-headers'
import type { URLRequest } from '../request/url-request'
import type { Serializer } from './serializer'

/**
 * {@link Serializer} that decodes the response body as text.
 *
 * Used by {@link Request.serializingText}. Encoding defaults to UTF-8; pass a
 * `TextDecoder` label when the upstream API uses another charset.
 */
export class TextSerializer implements Serializer<string> {
  // MARK: - Properties

  private readonly decoder: TextDecoder

  // MARK: - Constructor

  /**
   * @param label - WHATWG encoding label accepted by {@link TextDecoder}
   *   (default `utf-8`).
   */
  constructor(label = 'utf-8') {
    this.decoder = new TextDecoder(label)
  }

  // MARK: - Serializer

  /**
   * @returns Body decoded with the configured encoding.
   */
  serialize(
    _request: URLRequest,
    _statusCode: number,
    _headers: HTTPHeaders,
    body: Uint8Array,
  ): string {
    return this.decoder.decode(body)
  }
}
