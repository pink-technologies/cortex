// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { NetworkingError } from '../error/error'
import type { URLRequest } from '../request/url-request'

/**
 * Decision returned by a {@link RequestRetrier}.
 */
export type RetryResult =
  | { readonly retry: false }
  | { readonly retry: true; readonly delayMs: number }

/**
 * Determines whether a failed request should be retried.
 *
 * Integrations supply their own implementations via {@link Middleware}; the
 * library does not ship a default retry policy.
 */
export interface RequestRetrier {
  /**
   * @param request - Request that failed.
   * @param error - Failure from transport, validation, or serialization.
   * @param retryCount - Number of retries already attempted (0 on first failure).
   * @returns Whether to retry and an optional delay.
   */
  retry(
    request: URLRequest,
    error: NetworkingError,
    retryCount: number,
  ): RetryResult | Promise<RetryResult>
}
