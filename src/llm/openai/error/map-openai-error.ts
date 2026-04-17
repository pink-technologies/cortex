// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { APIError } from 'openai';

import { OpenAILLMError, OpenAiErrorCode } from './error';

/**
 * Maps an OpenAI {@link APIError} to a {@link OpenAiErrorCode}.
 */
export class OpenAiErrorMapper {
    // MARK: - Private properties
    private readonly apiError: APIError;

    // MARK: - Constructor

    /**
     * Creates a new {@link OpenAiErrorMapper} instance.
     *
     * @param apiError - The API error to map.
     */
    constructor(apiError: APIError) {
        this.apiError = apiError;
    }

    // MARK: - Public methods

    /**
     * Maps the API error to a {@link OpenAiErrorCode}.
     *
     * @returns The mapped error code.
     */
    toCode(): OpenAiErrorCode {
        switch (this.apiError.status) {
            case 429:
                return this.toRateLimitCode();

            case 400:
                return this.toBadRequestCode();

            default:
                return OpenAiErrorCode.UNKNOWN;
        }
    }

    // MARK: - Private methods

    private toRateLimitCode(): OpenAiErrorCode {
        switch (this.apiError.code) {
            case 'insufficient_quota':
                return OpenAiErrorCode.INSUFFICIENT_QUOTA;

            case 'rate_limit_exceeded':
                return OpenAiErrorCode.RATE_LIMIT_EXCEEDED;

            default:
                return OpenAiErrorCode.RATE_LIMIT_EXCEEDED;
        }
    }

    private toBadRequestCode(): OpenAiErrorCode {
        return this.jsonResponseFormatError()
            ? OpenAiErrorCode.JSON_RESPONSE_FORMAT
            : OpenAiErrorCode.UNKNOWN;
    }

    private jsonResponseFormatError(): boolean {
        const { param = '', code, type, message } = this.apiError;

        return (
            param?.startsWith('response_format.') ||
            code === 'invalid_json_schema' ||
            code === 'json_validate_failed' ||
            (type === 'invalid_request_error' &&
                /response_format|json_schema/i.test(message))
        );
    }
}
