// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { Request } from '@cortex/networking'
import type { CortexClient } from './cortex-client'

/**
 * Validated Cortex API request ready to decode a response.
 *
 * Built by {@link CortexClient.request}. Prefer {@link responseJson} when the
 * endpoint returns a body; {@link response} when only success status matters.
 */
export class CortexRequest {
  // MARK: - Properties

  private readonly request: Request

  // MARK: - Constructor

  /**
   * Wraps a networking {@link Request} that already has validation enabled.
   *
   * @param request - Session request prepared by {@link CortexClient}.
   */
  constructor(request: Request) {
    this.request = request
  }

  // MARK: - Instance methods

  /**
   * Executes the request and discards the response body.
   *
   * Used for complete / fail / heartbeat style endpoints where only the HTTP
   * status matters.
   *
   * @throws When validation or transport fails.
   */
  async response(): Promise<void> {
    const result = await this.request.serializingText()

    if (!result.result.ok) {
      throw result.result.error
    }
  }

  /**
   * Executes the request and decodes a JSON response body.
   *
   * @typeParam T - Expected JSON response shape.
   * @returns Decoded JSON body as `T`.
   * @throws When validation or JSON deserialization fails.
   */
  async responseJson<T>(): Promise<T> {
    const result = await this.request.serializingJson<T>()

    if (!result.result.ok) {
      throw result.result.error
    }

    return result.result.value
  }
}
