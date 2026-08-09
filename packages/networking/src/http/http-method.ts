// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Standard HTTP request methods accepted by {@link Session.request} /
 * {@link RequestBuilder}.
 *
 * Values are uppercase strings matching the Fetch `RequestInit.method`
 * convention. {@link RequestBuilder} defaults to {@link HTTPMethod.GET} when
 * omitted.
 *
 * Prefer these constants at call sites instead of raw method strings:
 *
 * ```ts
 * session.request(url, { method: HTTPMethod.POST })
 * ```
 *
 * With the default {@link URLEncodedParameterEncoder}:
 * - `GET` / `HEAD` — `parameters` become the URL query string
 * - other methods — `parameters` are written to the request body
 *
 * Custom {@link ParameterEncoder} implementations (e.g. JSON) may encode
 * differently regardless of method.
 *
 * @see {@link URLRequest.method}
 * @see {@link RequestBuilderOptions.method}
 */
export const HTTPMethod = {
  /**
   * Deletes the target resource.
   */
  DELETE: 'DELETE',

  /**
   * Retrieves a representation of the target resource.
   */
  GET: 'GET',

  /**
   * Same as GET without a response body.
   */
  HEAD: 'HEAD',

  /**
   * Describes communication options for the target resource.
   */
  OPTIONS: 'OPTIONS',

  /**
   * Partially updates the target resource.
   */
  PATCH: 'PATCH',

  /**
   * Submits an entity to the target resource.
   */
  POST: 'POST',

  /**
   * Replaces the target resource.
   */
  PUT: 'PUT',

  /**
   * Performs a message loop-back test along the path to the target resource.
   */
  TRACE: 'TRACE',
} as const

/**
 * Union of supported HTTP method string values.
 */
export type HTTPMethod = (typeof HTTPMethod)[keyof typeof HTTPMethod]
