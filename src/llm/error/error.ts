// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

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
    abstract readonly code: string;
}

/**
 * Thrown when an LLM model is not supported.
 */
export class LLMModelNotSupportedError extends LLMError {
    // MARK: - Properties

    /**
     * Machine-readable code for LLM model not supported errors.
     */
    readonly code = 'LLM_MODEL_NOT_SUPPORTED_ERROR';
}

/**
 * Thrown when an LLM message role is not supported.
 */
export class LLMMessageRoleNotSupportedError extends LLMError {
    // MARK: - Properties

    /**
     * Machine-readable code for LLM message role not supported errors.
     */
    readonly code = 'LLM_MESSAGE_ROLE_NOT_SUPPORTED_ERROR';
}

/**
 * Thrown when an LLM response format is not supported.
 */
export class LLMResponseFormatNotSupportedError extends LLMError {
    // MARK: - Properties

    /**
     * Machine-readable code for LLM response format not supported errors.
     */
    readonly code = 'LLM_RESPONSE_FORMAT_NOT_SUPPORTED_ERROR';
}

/**
 * Thrown when an LLM API key is not configured.
 */
export class LLMAPIKeyNotConfiguredError extends LLMError {
    // MARK: - Properties

    /**
     * Machine-readable code for LLM API key not configured errors.
     */
    readonly code = 'LLM_API_KEY_NOT_CONFIGURED_ERROR';
}

/**
 * Thrown when an LLM has no choices.
 */
export class LLMNoChoicesError extends LLMError {
    // MARK: - Properties

    /**
     * Machine-readable code for LLM no choices errors.
     */
    readonly code = 'LLM_NO_CHOICES_ERROR';
}

/**
 * Thrown when an LLM tool call is not supported.
 */
export class LLMToolCallNotSupportedError extends LLMError {
    // MARK: - Properties

    /**
     * Machine-readable code for LLM tool call not supported errors.
     */
    readonly code = 'LLM_TOOL_CALL_NOT_SUPPORTED_ERROR';
}