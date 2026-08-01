// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JSONParameterEncoder } from '../../src/encoder/parameter-encoder'
import { HTTPMethod } from '../../src/http/http-method'
import { RequestBuilder } from '../../src/request/request-builder'

describe('RequestBuilder', () => {
  const builder = new RequestBuilder()

  it('builds defaults', () => {
    const request = builder.build('https://example.com')
    expect(request.method).toBe(HTTPMethod.GET)
    expect(request.url).toBe('https://example.com/')
  })

  it('encodes query parameters for GET', () => {
    const request = builder.build('https://example.com/search', {
      parameters: { q: 'x', empty: null },
    })
    expect(request.url).toContain('q=x')
    expect(request.url).not.toContain('empty')
  })

  it('uses a custom parameter encoder', () => {
    const request = builder.build('https://example.com/items', {
      method: HTTPMethod.POST,
      parameterEncoder: JSONParameterEncoder.default,
      parameters: { name: 'a' },
    })
    expect(request.body).toBe(JSON.stringify({ name: 'a' }))
    expect(request.headers.get('content-type')).toBe('application/json')
  })

  it('encodes form body for POST with default encoder', () => {
    const request = builder.build('https://example.com', {
      method: HTTPMethod.POST,
      parameters: { name: 'a' },
    })
    expect(request.body).toBe('name=a')
  })
})

