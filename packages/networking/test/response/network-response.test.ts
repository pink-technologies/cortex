// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NetworkingResponseValidationError } from '../../src/error/error'
import { HTTPHeaders } from '../../src/headers/http-headers'
import { NetworkResponse } from '../../src/response/network-response'
import { createURLRequest } from '../support/url-request'

describe('NetworkResponse', () => {
  const request = createURLRequest()

  it('exposes success helpers and map', () => {
    const success = new NetworkResponse(request, 200, new HTTPHeaders(), {
      ok: true,
      value: 1,
    })
    expect(success.isSuccess).toBe(true)
    expect(success.getOrThrow()).toBe(1)
    expect(success.map((n) => n + 1).getOrThrow()).toBe(2)
  })

  it('preserves failures through map and getOrThrow', () => {
    const failure = new NetworkResponse(request, 500, new HTTPHeaders(), {
      ok: false,
      error: new NetworkingResponseValidationError('bad'),
    })
    expect(failure.isSuccess).toBe(false)
    expect(() => failure.getOrThrow()).toThrow(NetworkingResponseValidationError)
    expect(failure.map(() => 1).result.ok).toBe(false)
  })
})
