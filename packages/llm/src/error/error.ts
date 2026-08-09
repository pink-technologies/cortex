// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Additional diagnostic metadata associated with an {@link LLMError}.
 *
 * Use this to attach non-public context such as the originating provider, the
 * underlying cause, and a provider request identifier. These values are intended
 * for logging, observability, and debugging—not for direct consumer-facing
 * behavior.
 */
export type LLMErrorOptions = {
  /**
   * The underlying error that originated the domain error.
   *
   * Typically a provider SDK or transport-level failure. Prefer logging this
   * value rather than exposing it to API clients.
   */
  cause?: unknown

  /**
   * Identifier of the LLM provider associated with the failure.
   *
   * Examples: `openai`, `anthropic`.
   */
  provider?: string

  /**
   * Provider-specific request identifier, when available.
   *
   * Useful for correlating application logs with upstream provider support
   * investigations.
   */
  requestId?: string
}

/**
 * Base class for all LLM-related domain errors.
 *
 * Provider adapters and mappers should convert vendor-specific failures into
 * subclasses of {@link LLMError} so callers can branch on stable {@link code}
 * values without depending on OpenAI, Anthropic, or HTTP details.
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code}
 * - carry a user-safe, provider-agnostic message
 * - optionally retain {@link LLMErrorOptions} for diagnostics
 */
export abstract class LLMError extends Error {
  // MARK: - Properties

  /**
   * Machine-readable error code identifying the failure type.
   *
   * Codes are stable identifiers for logging, metrics, and client mapping—not
   * for free-form display.
   */
  abstract readonly code: string

  /**
   * Underlying error that originated this domain error, if any.
   *
   * Intended for diagnostics and logging; generally not for direct exposure to
   * consumers.
   */
  readonly cause?: unknown

  /**
   * LLM provider associated with the failure, if known.
   */
  readonly provider?: string

  /**
   * Provider-specific request identifier, if available.
   */
  readonly requestId?: string

  // MARK: - Initializer

  /**
   * Creates a new {@link LLMError}.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata (cause, provider, request id).
   */
  protected constructor(message: string, options?: LLMErrorOptions) {
    super(message)

    this.name = new.target.name
    this.cause = options?.cause
    this.provider = options?.provider
    this.requestId = options?.requestId
  }
}

/**
 * Thrown when authentication with the configured LLM provider fails.
 *
 * Typical causes include an invalid, expired, or revoked API key, or a
 * provider response that indicates the caller is not authenticated.
 */
export class LLMAuthenticationError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for LLM authentication errors.
   */
  readonly code = 'LLM_AUTHENTICATION_ERROR'

  // MARK: - Initializer

  /**
   * Creates an authentication error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'Authentication with the LLM provider failed.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when an LLM API key is missing from application configuration.
 *
 * Distinct from {@link LLMAuthenticationError}: the key was never supplied (or
 * could not be resolved) before a provider call was attempted.
 */
export class LLMAPIKeyNotConfiguredError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for LLM API key not configured errors.
   */
  readonly code = 'LLM_API_KEY_NOT_CONFIGURED_ERROR'

  // MARK: - Initializer

  /**
   * Creates an API key not configured error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The LLM API key is not configured.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when the LLM provider cannot be reached due to a network or
 * transport-level failure.
 *
 * Covers DNS failures, refused connections, TLS errors, and similar issues
 * where no usable HTTP response was obtained from the provider.
 */
export class LLMConnectionError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for LLM connection errors.
   */
  readonly code = 'LLM_CONNECTION_ERROR'

  // MARK: - Initializer

  /**
   * Creates a connection error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The LLM provider could not be reached.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when a default LLM model is required but has not been configured.
 *
 * Raised when the runtime must select a model (for example a factory default)
 * and no default model identifier is available in configuration.
 */
export class LLMDefaultModelNotConfiguredError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for missing default LLM model configuration.
   */
  readonly code = 'LLM_DEFAULT_MODEL_NOT_CONFIGURED_ERROR'

  // MARK: - Initializer

  /**
   * Creates a default model not configured error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The default LLM model is not configured.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when the LLM provider returns an empty response or no usable output.
 *
 * Typical cases include a response with no choices, or a choice whose message
 * content cannot be mapped into domain content blocks.
 */
export class LLMEmptyResponseError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for LLM empty response errors.
   */
  readonly code = 'LLM_EMPTY_RESPONSE_ERROR'

  // MARK: - Initializer

  /**
   * Creates an empty response error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The LLM provider returned an empty response.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when an LLM request is rejected because it is invalid or malformed.
 *
 * Maps provider “bad request” style failures: unsupported parameters, invalid
 * payload shape, or other client-side request validation errors.
 */
export class LLMInvalidRequestError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for LLM invalid request errors.
   */
  readonly code = 'LLM_INVALID_REQUEST_ERROR'

  // MARK: - Initializer

  /**
   * Creates an invalid request error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The LLM request is invalid.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when a conversation message uses a role the adapter cannot map.
 *
 * Raised while encoding {@link LLMMessage} values for a provider that does not
 * accept the given {@link LLMMessageRole}, or when mapping a provider role back
 * into the domain model fails.
 */
export class LLMMessageRoleNotSupportedError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for LLM message role not supported errors.
   */
  readonly code = 'LLM_MESSAGE_ROLE_NOT_SUPPORTED_ERROR'

  // MARK: - Initializer

  /**
   * Creates a message role not supported error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The LLM message role is not supported.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when the selected model identifier is not supported by the provider
 * or by this adapter.
 *
 * Distinct from authentication or permission failures: the request is otherwise
 * valid, but the model name is unknown, deprecated, or unavailable.
 */
export class LLMModelNotSupportedError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for LLM model not supported errors.
   */
  readonly code = 'LLM_MODEL_NOT_SUPPORTED_ERROR'

  // MARK: - Initializer

  /**
   * Creates a model not supported error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The selected LLM model is not supported.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when the LLM provider denies access to the requested operation or
 * resource.
 *
 * The caller may be authenticated but lacks permission for the model, org, or
 * API surface being used.
 */
export class LLMPermissionDeniedError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for LLM permission denied errors.
   */
  readonly code = 'LLM_PERMISSION_DENIED_ERROR'

  // MARK: - Initializer

  /**
   * Creates a permission denied error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'Permission was denied by the LLM provider.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when the LLM provider rate limit has been exceeded.
 *
 * Callers may retry with backoff when appropriate. Prefer this over
 * {@link LLMServiceUnavailableError} when the provider explicitly signals
 * throttling.
 */
export class LLMRateLimitError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for LLM rate limit errors.
   */
  readonly code = 'LLM_RATE_LIMIT_ERROR'

  // MARK: - Initializer

  /**
   * Creates a rate limit error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The LLM provider rate limit has been exceeded.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when an in-flight language-model request is cancelled before completion.
 *
 * Typical causes include {@link LLMRequest.signal} being aborted by the caller,
 * or a provider SDK abort (for example OpenAI `APIUserAbortError`). Distinct
 * from {@link LLMTimeoutError}, which indicates the request exceeded a time
 * budget rather than an explicit cancellation.
 *
 * Callers may treat this as a non-retryable, expected interruption unless they
 * intentionally restart the request.
 */
export class LLMRequestCancelledError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for cancelled LLM request errors.
   */
  readonly code = 'LLM_REQUEST_CANCELLED_ERROR'

  // MARK: - Initializer

  /**
   * Creates a request cancelled error.
   *
   * @param message - Human-readable description of the cancellation.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The LLM request was cancelled.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when a provider response cannot be decoded into the domain model.
 *
 * Raised by response mappers when the payload shape is unexpected, required
 * fields are missing, or content blocks cannot be normalized into
 * {@link LLMResponse}.
 */
export class LLMResponseDecodingError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for LLM response decoding errors.
   */
  readonly code = 'LLM_RESPONSE_DECODING_ERROR'

  // MARK: - Initializer

  /**
   * Creates a response decoding error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The LLM response could not be decoded.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when a requested response format is not supported by the adapter or
 * provider.
 *
 * Use when the client asks for an output mode (for example a structured format)
 * that the current provider integration cannot fulfill.
 */
export class LLMResponseFormatNotSupportedError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for LLM response format not supported errors.
   */
  readonly code = 'LLM_RESPONSE_FORMAT_NOT_SUPPORTED_ERROR'

  // MARK: - Initializer

  /**
   * Creates a response format not supported error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The requested LLM response format is not supported.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when the LLM provider is temporarily unavailable or fails to process
 * the request due to an upstream service issue.
 *
 * Covers provider outages and 5xx-style failures that are often transient and
 * may be retried. Distinct from {@link LLMConnectionError} (no usable reach
 * to the provider) and {@link LLMRateLimitError} (explicit throttling).
 */
export class LLMServiceUnavailableError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for LLM service unavailable errors.
   */
  readonly code = 'LLM_SERVICE_UNAVAILABLE_ERROR'

  // MARK: - Initializer

  /**
   * Creates a service unavailable error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The LLM provider is temporarily unavailable.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when an LLM request exceeds its configured time budget.
 *
 * Distinct from {@link LLMRequestCancelledError}: the deadline elapsed without
 * an explicit caller abort.
 */
export class LLMTimeoutError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for LLM timeout errors.
   */
  readonly code = 'LLM_TIMEOUT_ERROR'

  // MARK: - Initializer

  /**
   * Creates a timeout error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The LLM request timed out.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when a tool/function call in the provider response cannot be handled.
 *
 * Raised when the adapter encounters tool-call payload it does not support
 * (for example an unrecognized tool-call shape) while mapping the response.
 */
export class LLMToolCallNotSupportedError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for LLM tool call not supported errors.
   */
  readonly code = 'LLM_TOOL_CALL_NOT_SUPPORTED_ERROR'

  // MARK: - Initializer

  /**
   * Creates a tool call not supported error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The requested LLM tool call is not supported.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Thrown when the LLM provider returns an error that cannot be mapped to a
 * more specific domain type.
 *
 * Use as the fallback after provider error mapping so callers always receive an
 * {@link LLMError} rather than a raw SDK exception.
 */
export class LLMUnknownProviderError extends LLMError {
  // MARK: - Properties

  /**
   * Machine-readable code for unknown LLM provider errors.
   */
  readonly code = 'LLM_UNKNOWN_PROVIDER_ERROR'

  // MARK: - Initializer

  /**
   * Creates an unknown provider error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic metadata associated with the error.
   */
  constructor(
    message = 'The LLM provider returned an unknown error.',
    options?: LLMErrorOptions,
  ) {
    super(message, options)
  }
}
