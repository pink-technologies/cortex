// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  NetworkingConnectionError,
  NetworkingInvalidURLError,
  NetworkingParameterEncodingError,
  NetworkingRequestAdaptationError,
  NetworkingRequestCancelledError,
  NetworkingResponseSerializationError,
  NetworkingResponseValidationError,
} from '../../src/error/error'

describe('NetworkingError subclasses', () => {
  it('exposes codes, name, and optional diagnostics', () => {
    const error = new NetworkingConnectionError('boom', {
      cause: new Error('root'),
      responseBody: 'x',
      statusCode: 502,
    })
    expect(error.code).toBe('NETWORKING_CONNECTION_ERROR')
    expect(error.name).toBe('NetworkingConnectionError')
    expect(error.statusCode).toBe(502)
    expect(error.responseBody).toBe('x')
    expect(error.cause).toBeInstanceOf(Error)
  })

  it('uses default messages for each subclass', () => {
    expect(new NetworkingRequestCancelledError().code).toBe(
      'NETWORKING_REQUEST_CANCELLED_ERROR',
    )
    expect(new NetworkingInvalidURLError().message).toContain('invalid')
    expect(new NetworkingParameterEncodingError().code).toBe(
      'NETWORKING_PARAMETER_ENCODING_ERROR',
    )
    expect(new NetworkingRequestAdaptationError().code).toBe(
      'NETWORKING_REQUEST_ADAPTATION_ERROR',
    )
    expect(new NetworkingResponseValidationError().code).toBe(
      'NETWORKING_RESPONSE_VALIDATION_ERROR',
    )
    expect(new NetworkingResponseSerializationError().code).toBe(
      'NETWORKING_RESPONSE_SERIALIZATION_ERROR',
    )
    expect(new NetworkingConnectionError().message).toBe(
      'The HTTP request could not be completed.',
    )
  })
})
