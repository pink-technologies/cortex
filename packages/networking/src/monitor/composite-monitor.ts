// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { NetworkingError } from '../error/error'
import type { URLRequest } from '../request/url-request'
import type { Monitor } from './monitor'

/**
 * Fan-out {@link Monitor} that forwards lifecycle events to child monitors.
 *
 * Child errors are swallowed so monitoring never breaks the request path.
 */
export class CompositeMonitor implements Monitor {
  // MARK: - Properties

  private readonly monitors: readonly Monitor[]

  // MARK: - Constructor

  /**
   * @param monitors - Child monitors notified in order.
   */
  constructor(monitors: readonly Monitor[] = []) {
    this.monitors = monitors
  }

  // MARK: - Monitor

  /**
   * @param request - Request about to start.
   */
  requestDidStart(request: URLRequest): void {
    for (const monitor of this.monitors) {
      try {
        monitor.requestDidStart?.(request)
      } catch {
        // Monitoring must not affect the request.
      }
    }
  }

  /**
   * @param request - Completed request.
   * @param statusCode - HTTP status.
   */
  requestDidComplete(request: URLRequest, statusCode: number): void {
    for (const monitor of this.monitors) {
      try {
        monitor.requestDidComplete?.(request, statusCode)
      } catch {
        // Monitoring must not affect the request.
      }
    }
  }

  /**
   * @param request - Failed request.
   * @param error - Failure.
   */
  requestDidFail(request: URLRequest, error: NetworkingError): void {
    for (const monitor of this.monitors) {
      try {
        monitor.requestDidFail?.(request, error)
      } catch {
        // Monitoring must not affect the request.
      }
    }
  }
}
