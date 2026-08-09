// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { URLConvertible } from './http/url-convertible'
import { Middleware } from './middleware/middleware'
import type { Monitor } from './monitor/monitor'
import { NoopMonitor } from './monitor/monitor'
import { Request } from './request/request'
import {
  RequestBuilder,
  type RequestBuilderOptions,
} from './request/request-builder'

/**
 * Configuration for {@link Session}.
 */
export interface SessionOptions {
  /**
   * `fetch` implementation (defaults to global `fetch`).
   */
  readonly fetch?: typeof fetch

  /**
   * Request middleware (intercept + retry).
   */
  readonly middleware?: Middleware

  /**
   * Lifecycle monitor (defaults to no-op).
   */
  readonly monitor?: Monitor
}

/**
 * Concrete HTTP session backed by `fetch` and `AbortController`.
 *
 * Entry point for Nest integrations: create once (optionally with middleware),
 * then call {@link request} for each outbound call.
 */
export class Session {
  // MARK: - Properties

  private readonly fetchImpl: typeof fetch
  private readonly middleware: Middleware
  private readonly monitor: Monitor
  private readonly builder = new RequestBuilder()

  // MARK: - Constructor

  /**
   * @param options - Middleware, monitor, and fetch override.
   */
  constructor(options: SessionOptions = {}) {
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis)
    this.middleware = options.middleware ?? new Middleware()
    this.monitor = options.monitor ?? new NoopMonitor()
  }

  // MARK: - Instance methods

  /**
   * Creates a fluent {@link Request}.
   *
   * @param url - Target URL.
   * @param options - Method, headers, body, parameters, signal.
   * @returns Request ready for validate / serialize.
   */
  request(url: URLConvertible, options: RequestBuilderOptions = {}): Request {
    const built = this.builder.build(url, options)
    return new Request({
      fetchImpl: this.fetchImpl,
      middleware: this.middleware,
      monitor: this.monitor,
      request: built,
    })
  }
}
