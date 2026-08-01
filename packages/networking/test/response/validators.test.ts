// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NetworkingResponseValidationError } from '../../src/error/error'
import { validateResponse } from '../../src/response/validators'

describe('validateResponse', () => {
  it('accepts default 2xx', () => {
    validateResponse({ body: new Uint8Array(), statusCode: 204 })
  })

  it('rejects non-acceptable status codes with body text', () => {
    try {
      validateResponse({
        body: new TextEncoder().encode('nope'),
        statusCode: 500,
      })
      fail('expected throw')
    } catch (error) {
      expect(error).toBeInstanceOf(NetworkingResponseValidationError)
      expect((error as NetworkingResponseValidationError).responseBody).toBe('nope')
      expect((error as NetworkingResponseValidationError).statusCode).toBe(500)
    }
  })

  it('checks content types when configured', () => {
    validateResponse(
      {
        body: new Uint8Array(),
        contentType: 'application/json; charset=utf-8',
        statusCode: 200,
      },
      { acceptableContentTypes: ['application/json'] },
    )
    expect(() =>
      validateResponse(
        { body: new Uint8Array(), contentType: 'text/plain', statusCode: 200 },
        { acceptableContentTypes: ['application/json'] },
      ),
    ).toThrow(NetworkingResponseValidationError)
    expect(() =>
      validateResponse(
        { body: new Uint8Array(), statusCode: 200 },
        { acceptableContentTypes: ['application/json'] },
      ),
    ).toThrow(NetworkingResponseValidationError)
  })

  it('skips content-type check for empty acceptable list', () => {
    validateResponse(
      { body: new Uint8Array(), statusCode: 200 },
      { acceptableContentTypes: [] },
    )
  })

  it('rejects every status when acceptableStatusCodes is empty', () => {
    expect(() =>
      validateResponse(
        { body: new Uint8Array(), statusCode: 200 },
        { acceptableStatusCodes: [] },
      ),
    ).toThrow(NetworkingResponseValidationError)
  })
})
