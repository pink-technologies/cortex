// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import OpenAI from 'openai'
import {
  LLMAuthenticationError,
  LLMConnectionError,
  LLMInvalidRequestError,
  LLMModelNotSupportedError,
  LLMPermissionDeniedError,
  LLMRateLimitError,
  LLMRequestCancelledError,
  LLMServiceUnavailableError,
  LLMTimeoutError,
  LLMUnknownProviderError,
} from '../../../src/error/error'
import { LLMProviderType } from '../../../src/provider/llm-provider-type'
import { mapFromOpenAIError } from '../../../src/provider/openai/mappers/openai-mappers'

const headers = new Headers()

describe('OpenAI error mapping', () => {
  describe('Given an existing Cortex LLMError', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns the same error instance', () => {
        const cause = new LLMTimeoutError('already mapped')

        const error = mapFromOpenAIError(cause)

        expect(error).toBe(cause)
      })
    })
  })

  describe('Given an APIUserAbortError', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns LLMRequestCancelledError', () => {
        const cause = new OpenAI.APIUserAbortError()

        const error = mapFromOpenAIError(cause)

        expect(error).toBeInstanceOf(LLMRequestCancelledError)
        expect(error.code).toBe('LLM_REQUEST_CANCELLED_ERROR')
        expect(error.provider).toBe(LLMProviderType.OpenAI)
        expect(error.cause).toBe(cause)
      })
    })
  })

  describe('Given an APIConnectionTimeoutError', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns LLMTimeoutError', () => {
        const cause = new OpenAI.APIConnectionTimeoutError({
          message: 'Request timed out',
        })

        const error = mapFromOpenAIError(cause)

        expect(error).toBeInstanceOf(LLMTimeoutError)
        expect(error.code).toBe('LLM_TIMEOUT_ERROR')
        expect(error.provider).toBe(LLMProviderType.OpenAI)
        expect(error.cause).toBe(cause)
      })
    })
  })

  describe('Given an APIConnectionError', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns LLMConnectionError', () => {
        const cause = new OpenAI.APIConnectionError({
          message: 'offline',
        })

        const error = mapFromOpenAIError(cause)

        expect(error).toBeInstanceOf(LLMConnectionError)
        expect(error.code).toBe('LLM_CONNECTION_ERROR')
        expect(error.cause).toBe(cause)
      })
    })
  })

  describe('Given an AuthenticationError', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns LLMAuthenticationError', () => {
        const cause = new OpenAI.AuthenticationError(401, { error: {} }, 'Unauthorized', headers)

        const error = mapFromOpenAIError(cause)

        expect(error).toBeInstanceOf(LLMAuthenticationError)
        expect(error.code).toBe('LLM_AUTHENTICATION_ERROR')
        expect(error.provider).toBe(LLMProviderType.OpenAI)
        expect(error.cause).toBe(cause)
      })
    })
  })

  describe('Given a PermissionDeniedError', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns LLMPermissionDeniedError', () => {
        const cause = new OpenAI.PermissionDeniedError(403, { error: {} }, 'Forbidden', headers)

        const error = mapFromOpenAIError(cause)

        expect(error).toBeInstanceOf(LLMPermissionDeniedError)
        expect(error.code).toBe('LLM_PERMISSION_DENIED_ERROR')
        expect(error.cause).toBe(cause)
      })
    })
  })

  describe('Given a BadRequestError', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns LLMInvalidRequestError', () => {
        const cause = new OpenAI.BadRequestError(400, { error: {} }, 'Bad request', headers)

        const error = mapFromOpenAIError(cause)

        expect(error).toBeInstanceOf(LLMInvalidRequestError)
        expect(error.message).toBe('The LLM request is invalid.')
        expect(error.cause).toBe(cause)
      })
    })
  })

  describe('Given an UnprocessableEntityError', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns LLMInvalidRequestError', () => {
        const cause = new OpenAI.UnprocessableEntityError(422, { error: {} }, 'Unprocessable', headers)

        const error = mapFromOpenAIError(cause)

        expect(error).toBeInstanceOf(LLMInvalidRequestError)
        expect(error.message).toBe('The LLM request could not be processed.')
        expect(error.cause).toBe(cause)
      })
    })
  })

  describe('Given a NotFoundError for a model', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns LLMModelNotSupportedError', () => {
        const cause = new OpenAI.NotFoundError(
          404,
          {
            error: {},
            code: 'model_not_found',
            param: 'model',
          },
          'Model missing',
          headers,
        )

        const error = mapFromOpenAIError(cause)

        expect(error).toBeInstanceOf(LLMModelNotSupportedError)
        expect(error.code).toBe('LLM_MODEL_NOT_SUPPORTED_ERROR')
        expect(error.cause).toBe(cause)
      })
    })
  })

  describe('Given a NotFoundError for a non-model resource', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns LLMInvalidRequestError', () => {
        const cause = new OpenAI.NotFoundError(404, { error: {} }, 'Missing resource', headers)

        const error = mapFromOpenAIError(cause)

        expect(error).toBeInstanceOf(LLMInvalidRequestError)
        expect(error.message).toBe('The requested LLM resource was not found.')
        expect(error.cause).toBe(cause)
      })
    })
  })

  describe('Given a RateLimitError', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns LLMRateLimitError', () => {
        const cause = new OpenAI.RateLimitError(429, { error: {} }, 'Too many requests', headers)

        const error = mapFromOpenAIError(cause)

        expect(error).toBeInstanceOf(LLMRateLimitError)
        expect(error.code).toBe('LLM_RATE_LIMIT_ERROR')
        expect(error.provider).toBe(LLMProviderType.OpenAI)
        expect(error.cause).toBe(cause)
      })
    })
  })

  describe('Given an InternalServerError', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns LLMServiceUnavailableError', () => {
        const cause = new OpenAI.InternalServerError(500, { error: {} }, 'Unavailable', headers)

        const error = mapFromOpenAIError(cause)

        expect(error).toBeInstanceOf(LLMServiceUnavailableError)
        expect(error.code).toBe('LLM_SERVICE_UNAVAILABLE_ERROR')
        expect(error.cause).toBe(cause)
      })
    })
  })

  describe('Given a generic APIError', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns LLMUnknownProviderError', () => {
        const cause = new OpenAI.APIError(418, { error: {} }, 'Teapot', headers)

        const error = mapFromOpenAIError(cause)

        expect(error).toBeInstanceOf(LLMUnknownProviderError)
        expect(error.message).toBe('The LLM provider returned an unexpected error.')
        expect(error.cause).toBe(cause)
      })
    })
  })

  describe('Given an unknown JavaScript error', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns LLMUnknownProviderError with the original message', () => {
        const cause = new Error('boom')

        const error = mapFromOpenAIError(cause)

        expect(error).toBeInstanceOf(LLMUnknownProviderError)
        expect(error.code).toBe('LLM_UNKNOWN_PROVIDER_ERROR')
        expect(error.message).toBe('boom')
        expect(error.provider).toBe(LLMProviderType.OpenAI)
        expect(error.cause).toBe(cause)
      })
    })
  })

  describe('Given a non-Error value', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns LLMUnknownProviderError with a generic message', () => {
        const error = mapFromOpenAIError('unexpected')

        expect(error).toBeInstanceOf(LLMUnknownProviderError)
        expect(error.message).toBe('An unknown LLM provider error occurred.')
        expect(error.provider).toBe(LLMProviderType.OpenAI)
        expect(error.cause).toBe('unexpected')
      })
    })
  })
})
