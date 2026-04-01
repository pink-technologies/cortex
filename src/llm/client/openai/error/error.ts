// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { APIError } from "openai";

/**
 * The error codes for OpenAI LLM errors.
 */
export const OpenAiErrorCode = {
    /**
     * The error code for rate limit exceeded.
     */
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED_ERROR',

    /**
     * The error code for insufficient quota.
     */
    INSUFFICIENT_QUOTA: 'INSUFFICIENT_QUOTA_ERROR',

    /**
     * The error code for JSON response format.
     */
    JSON_RESPONSE_FORMAT: 'JSON_RESPONSE_FORMAT_ERROR',

    /**
     * The error code for unknown error.
     */
    UNKNOWN: 'UNKNOWN',
} as const;

/**
 * The type of the error code for OpenAI LLM errors.
 */
export type OpenAiErrorCode =
    (typeof OpenAiErrorCode)[keyof typeof OpenAiErrorCode];

// MARK: - Properties
export class OpenAILLMError extends Error {
    // MARK: - Properties

    /**
     * The error code.
     */
    readonly code: OpenAiErrorCode;

    /**
     * The underlying error.
     */
    readonly underlyingError: APIError;

    // MARK: - Constructor

    /**
     * Creates a new {@link OpenAILLMError}.
     *
     * @param code - The error code.
     * @param underlyingError - The underlying error.
     */
    constructor(code: OpenAiErrorCode, underlyingError: APIError) {
        super(code);
        this.name = 'OpenAILLMError';
        this.code = code;
        this.underlyingError = underlyingError;
    }
}