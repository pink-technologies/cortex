// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  LLMAPIKeyNotConfiguredError,
  LLMAuthenticationError,
  LLMConnectionError,
  LLMDefaultModelNotConfiguredError,
  LLMEmptyResponseError,
  LLMInvalidRequestError,
  LLMMessageRoleNotSupportedError,
  LLMModelNotSupportedError,
  LLMPermissionDeniedError,
  LLMRateLimitError,
  LLMRequestCancelledError,
  LLMResponseDecodingError,
  LLMResponseFormatNotSupportedError,
  LLMServiceUnavailableError,
  LLMTimeoutError,
  LLMToolCallNotSupportedError,
  LLMUnknownProviderError,
} from '../../src/error/error'

describe('LLM error types', () => {
  describe('Given each concrete LLMError subclass', () => {
    describe('When constructed with defaults', () => {
      it.each([
        [LLMAPIKeyNotConfiguredError, 'LLM_API_KEY_NOT_CONFIGURED_ERROR'],
        [LLMAuthenticationError, 'LLM_AUTHENTICATION_ERROR'],
        [LLMConnectionError, 'LLM_CONNECTION_ERROR'],
        [LLMDefaultModelNotConfiguredError, 'LLM_DEFAULT_MODEL_NOT_CONFIGURED_ERROR'],
        [LLMEmptyResponseError, 'LLM_EMPTY_RESPONSE_ERROR'],
        [LLMInvalidRequestError, 'LLM_INVALID_REQUEST_ERROR'],
        [LLMMessageRoleNotSupportedError, 'LLM_MESSAGE_ROLE_NOT_SUPPORTED_ERROR'],
        [LLMModelNotSupportedError, 'LLM_MODEL_NOT_SUPPORTED_ERROR'],
        [LLMPermissionDeniedError, 'LLM_PERMISSION_DENIED_ERROR'],
        [LLMRateLimitError, 'LLM_RATE_LIMIT_ERROR'],
        [LLMRequestCancelledError, 'LLM_REQUEST_CANCELLED_ERROR'],
        [LLMResponseDecodingError, 'LLM_RESPONSE_DECODING_ERROR'],
        [LLMResponseFormatNotSupportedError, 'LLM_RESPONSE_FORMAT_NOT_SUPPORTED_ERROR'],
        [LLMServiceUnavailableError, 'LLM_SERVICE_UNAVAILABLE_ERROR'],
        [LLMTimeoutError, 'LLM_TIMEOUT_ERROR'],
        [LLMToolCallNotSupportedError, 'LLM_TOOL_CALL_NOT_SUPPORTED_ERROR'],
        [LLMUnknownProviderError, 'LLM_UNKNOWN_PROVIDER_ERROR'],
      ] as const)('Then %p exposes code %s and its class name', (ErrorClass, code) => {
        const error = new ErrorClass()

        expect(error).toBeInstanceOf(ErrorClass)
        expect(error.code).toBe(code)
        expect(error.name).toBe(ErrorClass.name)
      })
    })
  })

  describe('Given diagnostic options', () => {
    describe('When constructing an LLMError', () => {
      it('Then preserves cause, provider, and requestId', () => {
        const cause = new Error('root')

        const error = new LLMTimeoutError('timed out', {
          cause,
          provider: 'openai',
          requestId: 'req_1',
        })

        expect(error.cause).toBe(cause)
        expect(error.provider).toBe('openai')
        expect(error.requestId).toBe('req_1')
        expect(error.message).toBe('timed out')
      })
    })
  })
})
