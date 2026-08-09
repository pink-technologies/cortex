// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { NetworkingError } from '../error/error'
import type { URLRequest } from '../request/url-request'

/**
 * Observability hooks for the HTTP request lifecycle.
 *
 * A {@link Monitor} is notified as {@link Session} executes a {@link Request}.
 * Hooks are optional and must never throw into the request path—implementations
 * (and {@link CompositeMonitor}) should treat monitoring failures as best-effort.
 *
 * Responsibilities:
 * - observe request start, transport completion, and terminal failure
 * - support logging, metrics, and diagnostics without altering request behavior
 *
 * Non-goals:
 * - mutating {@link URLRequest} (use {@link RequestInterceptor} instead)
 * - deciding retries (use {@link RequestRetrier} instead)
 * - replacing structured application logging frameworks
 */
export interface Monitor {
  /**
   * Invoked after middleware adaptation and immediately before the transport call.
   *
   * @param request - The adapted request about to be sent.
   */
  requestDidStart?(request: URLRequest): void

  /**
   * Invoked when the transport returns an HTTP response (before serialize success).
   *
   * A completed transport call can still fail later during validation or
   * serialization; those failures are reported via {@link requestDidFail}.
   *
   * @param request - The request that completed at the transport layer.
   * @param statusCode - HTTP status code from the response.
   */
  requestDidComplete?(request: URLRequest, statusCode: number): void

  /**
   * Invoked when the request ends in a {@link NetworkingError}.
   *
   * Covers transport failures, validation failures, serialization failures, and
   * cancellation. Not called for successful serialize completion.
   *
   * @param request - The request that failed.
   * @param error - Typed networking failure.
   */
  requestDidFail?(request: URLRequest, error: NetworkingError): void
}

/**
 * Default {@link Monitor} that performs no work.
 *
 * Used by {@link Session} when no monitor is supplied so the request path can
 * call monitor hooks unconditionally without null checks at every call site.
 */
export class NoopMonitor implements Monitor {
  // MARK: - Monitor

  requestDidStart(): void {}

  requestDidComplete(): void {}

  requestDidFail(): void {}
}
