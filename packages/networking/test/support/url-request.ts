// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPHeaders } from '../../src/headers/http-headers'
import { HTTPMethod } from '../../src/http/http-method'
import type { URLRequest } from '../../src/request/url-request'

/**
 * Minimal {@link URLRequest} for unit tests.
 */
export function createURLRequest(url = 'https://example.com'): URLRequest {
  return {
    headers: new HTTPHeaders(),
    method: HTTPMethod.GET,
    url,
  }
}
