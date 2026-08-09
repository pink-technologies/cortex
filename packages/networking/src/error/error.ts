// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Diagnostic metadata associated with a {@link NetworkingError}.
 */
export type NetworkingErrorOptions = {
  /**
   * Underlying failure for diagnostics (fetch rejection, Zod issue, etc.).
   */
  cause?: unknown

  /**
   * Raw response body text when available.
   */
  responseBody?: string

  /**
   * HTTP status when the failure is response-related.
   */
  statusCode?: number
}

/**
 * Base class for all `@cortex/networking` domain errors.
 *
 * Callers branch on {@link code} or `instanceof` concrete subclasses without
 * depending on fetch or message parsing.
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code}
 * - carry a user-safe message
 * - optionally retain status, body, and cause for diagnostics
 */
export abstract class NetworkingError extends Error {
  // MARK: - Properties

  /**
   * Machine-readable error code identifying the failure type.
   */
  abstract readonly code: string

  /**
   * Underlying error that originated this domain error, if any.
   */
  readonly cause?: unknown

  /**
   * HTTP status when the failure is response-related.
   */
  readonly statusCode?: number

  /**
   * Raw response body text when available.
   */
  readonly responseBody?: string

  // MARK: - Constructor

  /**
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata.
   */
  protected constructor(message: string, options?: NetworkingErrorOptions) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined)

    this.name = new.target.name
    this.cause = options?.cause
    this.statusCode = options?.statusCode
    this.responseBody = options?.responseBody
  }
}

/**
 * Thrown when a request is cancelled via {@link AbortSignal} or {@link Request.cancel}.
 */
export class NetworkingRequestCancelledError extends NetworkingError {
  // MARK: - Properties

  readonly code = 'NETWORKING_REQUEST_CANCELLED_ERROR'

  // MARK: - Constructor

  /**
   * @param message - Human-readable cancellation description.
   * @param options - Optional diagnostic metadata.
   */
  constructor(
    message = 'The request was cancelled.',
    options?: NetworkingErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when a URL cannot be resolved to an absolute HTTP(S) URL.
 */
export class NetworkingInvalidURLError extends NetworkingError {
  // MARK: - Properties

  readonly code = 'NETWORKING_INVALID_URL_ERROR'

  // MARK: - Constructor

  /**
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata.
   */
  constructor(message = 'The request URL is invalid.', options?: NetworkingErrorOptions) {
    super(message, options)
  }
}

/**
 * Thrown when request parameters cannot be encoded onto the URL or body.
 */
export class NetworkingParameterEncodingError extends NetworkingError {
  // MARK: - Properties

  readonly code = 'NETWORKING_PARAMETER_ENCODING_ERROR'

  // MARK: - Constructor

  /**
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata.
   */
  constructor(
    message = 'Failed to encode request parameters.',
    options?: NetworkingErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when a {@link RequestInterceptor} fails while adapting a request.
 */
export class NetworkingRequestAdaptationError extends NetworkingError {
  // MARK: - Properties

  readonly code = 'NETWORKING_REQUEST_ADAPTATION_ERROR'

  // MARK: - Constructor

  /**
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata.
   */
  constructor(
    message = 'Request interceptor failed.',
    options?: NetworkingErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when the HTTP status or content type fails validation.
 */
export class NetworkingResponseValidationError extends NetworkingError {
  // MARK: - Properties

  readonly code = 'NETWORKING_RESPONSE_VALIDATION_ERROR'

  // MARK: - Constructor

  /**
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata (typically status and body).
   */
  constructor(
    message = 'The HTTP response failed validation.',
    options?: NetworkingErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when the response body cannot be deserialized (parse or schema).
 */
export class NetworkingResponseSerializationError extends NetworkingError {
  // MARK: - Properties

  readonly code = 'NETWORKING_RESPONSE_SERIALIZATION_ERROR'

  // MARK: - Constructor

  /**
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata.
   */
  constructor(
    message = 'Failed to deserialize the HTTP response.',
    options?: NetworkingErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when the transport layer cannot complete the request (network/fetch).
 */
export class NetworkingConnectionError extends NetworkingError {
  // MARK: - Properties

  readonly code = 'NETWORKING_CONNECTION_ERROR'

  // MARK: - Constructor

  /**
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata.
   */
  constructor(
    message = 'The HTTP request could not be completed.',
    options?: NetworkingErrorOptions,
  ) {
    super(message, options)
  }
}
