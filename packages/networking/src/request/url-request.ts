// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { HTTPHeaders } from '../headers/http-headers'
import type { HTTPMethod } from '../http/http-method'

/**
 * Mutable HTTP request model produced before the transport call.
 */
export interface URLRequest {
  /**
   * Absolute request URL.
   */
  url: string

  /**
   * HTTP method.
   */
  method: HTTPMethod

  /**
   * Request headers.
   */
  headers: HTTPHeaders

  /**
   * Optional request body for `fetch`.
   */
  body?: BodyInit | null

  /**
   * Optional abort signal for the transport call.
   */
  signal?: AbortSignal
}
