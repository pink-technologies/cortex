// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NetworkingError } from '../error/error'
import type { HTTPHeaders } from '../headers/http-headers'
import type { URLRequest } from '../request/url-request'

/**
 * Discriminated result for a completed network call.
 */
export type NetworkResult<Success, Failure = NetworkingError> =
  | { readonly ok: true; readonly value: Success }
  | { readonly ok: false; readonly error: Failure }

/**
 * Typed response wrapping transport metadata and a success/failure result.
 *
 * Named {@link NetworkResponse} to avoid clashing with the Fetch API `Response`.
 */
export class NetworkResponse<Success, Failure = NetworkingError> {
  // MARK: - Properties

  /**
   * Request that produced this response.
   */
  readonly request: URLRequest

  /**
   * HTTP status code (0 when no HTTP response was received).
   */
  readonly statusCode: number

  /**
   * Response headers.
   */
  readonly headers: HTTPHeaders

  /**
   * Serialized success or typed failure.
   */
  readonly result: NetworkResult<Success, Failure>

  // MARK: - Constructor

  /**
   * @param request - Originating request.
   * @param statusCode - HTTP status.
   * @param headers - Response headers.
   * @param result - Success or failure payload.
   */
  constructor(
    request: URLRequest,
    statusCode: number,
    headers: HTTPHeaders,
    result: NetworkResult<Success, Failure>,
  ) {
    this.request = request
    this.statusCode = statusCode
    this.headers = headers
    this.result = result
  }

  // MARK: - Instance methods

  /**
   * @returns Whether {@link result} is a success.
   */
  get isSuccess(): boolean {
    return this.result.ok
  }

  /**
   * @returns Success value.
   * @throws The failure error when {@link result} is not ok.
   */
  getOrThrow(): Success {
    if (!this.result.ok) {
      throw this.result.error
    }
    return this.result.value
  }

  /**
   * Maps a successful value.
   *
   * @param transform - Success mapper.
   * @returns New response with mapped success, or the same failure.
   */
  map<NewSuccess>(
    transform: (value: Success) => NewSuccess,
  ): NetworkResponse<NewSuccess, Failure> {
    if (!this.result.ok) {
      return new NetworkResponse(this.request, this.statusCode, this.headers, this.result)
    }
    return new NetworkResponse(this.request, this.statusCode, this.headers, {
      ok: true,
      value: transform(this.result.value),
    })
  }
}
