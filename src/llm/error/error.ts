// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Additional diagnostic metadata associated with an {@link LLMError}.
 *
 * Use `LLMErrorOptions` to attach non-public error context such as the
 * originating provider, the underlying cause, a provider request identifier,
 * and retry guidance. These values are intended for logging, observability,
 * and debugging rather than for direct consumer-facing behavior.
 */
export type LLMErrorOptions = {
    /**
     * The underlying error that originated the domain error.
     *
     * This value is typically a provider-specific or transport-level error and
     * is intended for diagnostics and logging.
     */
    cause?: unknown

    /**
     * The identifier of the LLM provider associated with the failure.
     *
     * For example, this may contain values such as `openai` or `anthropic`.
     */
    provider?: string

    /**
     * A provider-specific request identifier, if available.
     *
     * This value can be used to correlate logs and support investigations with
     * upstream provider activity.
     */
    requestId?: string
}

/**
 * Base class for all LLM-related errors.
 *
 * This abstract error represents failures that occur within the
 * LLM application layer and serves as a boundary
 * between LLM logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 */
export abstract class LLMError extends Error {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying the type of
     * LLM error.
     */
    abstract readonly code: string

    /**
     * The underlying error that originated this domain error.
     *
     * This value is intended for diagnostics, logging, and debugging,
     * and should generally not be exposed directly to consumers.
     */
    readonly cause?: unknown

    /**
     * The provider associated with the failure, if applicable.
     */
    readonly provider?: string

    /**
     * A provider-specific request identifier, if available.
     */
    readonly requestId?: string

    // MARK: - Initializer

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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'Authentication with the LLM provider failed.',
        options?: LLMErrorOptions
    ) {
        super(message, options);
    }
}

/**
 * Thrown when an LLM API key is not configured.
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'The LLM API key is not configured.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}

/**
 * Thrown when the LLM provider cannot be reached due to a network or
 * transport-level failure.
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'The LLM provider could not be reached.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}

/**
 * Thrown when `LLM_DEFAULT_MODEL` is not set (see {@link LLMModule}).
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'The default LLM model is not configured.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}

/**
 * Thrown when the LLM provider returns an empty response or no usable output.
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'The LLM provider returned an empty response.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}

/**
 * Thrown when an LLM request is rejected because it is invalid or malformed.
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'The LLM request is invalid.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}

/**
 * Thrown when an LLM message role is not supported.
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'The LLM message role is not supported.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}

/**
 * Thrown when an LLM model is not supported.
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'The selected LLM model is not supported.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}

/**
 * Thrown when the LLM provider denies access to the requested operation or
 * resource.
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'Permission was denied by the LLM provider.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}

/**
 * Thrown when the LLM provider rate limit has been exceeded.
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'The LLM provider rate limit has been exceeded.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}

/**
 * Thrown when the LLM response cannot be decoded or mapped into the expected
 * domain representation.
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'The LLM response could not be decoded.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}

/**
 * Thrown when an LLM response format is not supported.
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'The requested LLM response format is not supported.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}

/**
 * Thrown when the LLM provider is temporarily unavailable or fails to process
 * the request due to an upstream service issue.
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'The LLM provider is temporarily unavailable.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}

/**
 * Thrown when an LLM request exceeds the configured timeout.
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'The LLM request timed out.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}

/**
 * Thrown when an LLM tool call is not supported.
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'The requested LLM tool call is not supported.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}

/**
 * Thrown when the LLM provider returns an unexpected error that cannot be
 * mapped to a more specific domain error.
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
     * - Parameter message: A human-readable description of the failure.
     * - Parameter options: Additional diagnostic metadata associated with the error.
     */
    constructor(
        message = 'The LLM provider returned an unknown error.',
        options?: LLMErrorOptions
    ) {
        super(message, options)
    }
}