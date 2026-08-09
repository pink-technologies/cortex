// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { URLRequest } from '../request/url-request'
import type { RequestInterceptor } from './request-interceptor'
import type { RequestRetrier, RetryResult } from './request-retrier'
import {
  NetworkingError,
  NetworkingRequestAdaptationError,
  NetworkingRequestCancelledError,
} from '../error/error'

/**
 * Configuration for {@link Middleware}.
 */
export interface MiddlewareOptions {
  /**
   * Ordered interceptors applied before each transport attempt.
   */
  readonly interceptors?: readonly RequestInterceptor[]

  /**
   * Ordered retriers consulted after failures; first affirmative wins.
   */
  readonly retriers?: readonly RequestRetrier[]
}

/**
 * Composable request middleware: intercept then optionally retry.
 */
export class Middleware {
  // MARK: - Properties

  private readonly interceptors: readonly RequestInterceptor[]
  private readonly retriers: readonly RequestRetrier[]

  // MARK: - Constructor

  /**
   * @param options - Interceptors and retriers.
   */
  constructor(options: MiddlewareOptions = {}) {
    this.interceptors = options.interceptors ?? []
    this.retriers = options.retriers ?? []
  }

  // MARK: - Instance methods

  /**
   * Runs interceptors in order.
   *
   * @param request - Initial request.
   * @returns Adapted request.
   * @throws {@link NetworkingRequestAdaptationError} when an interceptor fails.
   */
  async adapt(request: URLRequest): Promise<URLRequest> {
    let current = request
    for (const interceptor of this.interceptors) {
      try {
        current = await interceptor.adapt(current)
      } catch (cause) {
        if (cause instanceof NetworkingError) {
          throw cause
        }
        throw new NetworkingRequestAdaptationError('Request interceptor failed', {
          cause,
        })
      }
    }
    return current
  }

  /**
   * Asks retriers whether to retry after a failure.
   *
   * @param request - Failed request.
   * @param error - Failure.
   * @param retryCount - Prior retry count.
   * @param signal - Optional abort signal for delay sleep.
   * @returns Whether a retry should proceed (after any delay).
   */
  async shouldRetry(
    request: URLRequest,
    error: NetworkingError,
    retryCount: number,
    signal?: AbortSignal,
  ): Promise<boolean> {
    for (const retrier of this.retriers) {
      let decision: RetryResult
      try {
        decision = await retrier.retry(request, error, retryCount)
      } catch {
        continue
      }

      if (decision.retry) {
        await this.abortAwareSleep(decision.delayMs, signal ?? request.signal)
        return true
      }
    }
    return false
  }

  // MARK: - Private methods

  /**
   * Sleeps for `ms` milliseconds, aborting early when `signal` fires.
   */
  private async abortAwareSleep(
    ms: number,
    signal?: AbortSignal,
  ): Promise<void> {
    if (ms <= 0) {
      if (signal?.aborted) {
        throw new NetworkingRequestCancelledError('Sleep aborted', {
          cause: signal.reason,
        })
      }
      return
    }

    if (signal?.aborted) {
      throw new NetworkingRequestCancelledError('Sleep aborted', {
        cause: signal.reason,
      })
    }

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup()
        resolve()
      }, ms)

      const onAbort = (): void => {
        cleanup()
        reject(
          new NetworkingRequestCancelledError('Sleep aborted', {
            cause: signal?.reason,
          }),
        )
      }

      const cleanup = (): void => {
        clearTimeout(timer)
        signal?.removeEventListener('abort', onAbort)
      }

      signal?.addEventListener('abort', onAbort, { once: true })
    })
  }
}
