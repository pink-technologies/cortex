// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod } from '../../src/http/http-method'

describe('HTTPMethod', () => {
  it('exposes uppercase Fetch-compatible method constants', () => {
    expect(HTTPMethod.DELETE).toBe('DELETE')
    expect(HTTPMethod.GET).toBe('GET')
    expect(HTTPMethod.HEAD).toBe('HEAD')
    expect(HTTPMethod.OPTIONS).toBe('OPTIONS')
    expect(HTTPMethod.PATCH).toBe('PATCH')
    expect(HTTPMethod.POST).toBe('POST')
    expect(HTTPMethod.PUT).toBe('PUT')
    expect(HTTPMethod.TRACE).toBe('TRACE')
  })
})
