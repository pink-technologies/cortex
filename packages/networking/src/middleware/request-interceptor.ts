// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { URLRequest } from '../request/url-request'

/**
 * Adapts a {@link URLRequest} before the transport call (auth headers, etc.).
 */
export interface RequestInterceptor {
  /**
   * @param request - Mutable request to adapt.
   * @returns Adapted request (may be the same instance).
   */
  adapt(request: URLRequest): URLRequest | Promise<URLRequest>
}
