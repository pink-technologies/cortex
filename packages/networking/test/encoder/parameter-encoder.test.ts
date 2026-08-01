// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  ensureContentType,
  JSONParameterEncoder,
  URLEncodedParameterEncoder,
} from '../../src/encoder/parameter-encoder'
import { NetworkingParameterEncodingError } from '../../src/error/error'
import { HTTPHeaders } from '../../src/headers/http-headers'
import { HTTPMethod } from '../../src/http/http-method'
import { createURLRequest } from '../support/url-request'

describe('URLEncodedParameterEncoder', () => {
  it('no-ops for empty parameter maps', () => {
    const req = createURLRequest()
    new URLEncodedParameterEncoder().encode(req, { a: undefined, b: null })
    expect(req.url).toBe('https://example.com')
    expect(req.body).toBeUndefined()
  })

  it('encodes query for GET and form body for POST', () => {
    const get = createURLRequest()
    new URLEncodedParameterEncoder().encode(get, { q: 'x' })
    expect(get.url).toContain('q=x')

    const post = createURLRequest()
    post.method = HTTPMethod.POST
    new URLEncodedParameterEncoder().encode(post, { name: 'a' })
    expect(post.body).toBe('name=a')
    expect(post.headers.get('content-type')).toBe('application/x-www-form-urlencoded')
  })

  it('throws when URL cannot be constructed for GET params', () => {
    const broken = createURLRequest('http://[')
    expect(() =>
      new URLEncodedParameterEncoder().encode(broken, { q: '1' }),
    ).toThrow(NetworkingParameterEncodingError)
  })
})

describe('JSONParameterEncoder', () => {
  it('exposes shared default instances', () => {
    expect(JSONParameterEncoder.default).toBeInstanceOf(JSONParameterEncoder)
    expect(URLEncodedParameterEncoder.default).toBeInstanceOf(URLEncodedParameterEncoder)
  })

  it('encodes JSON body', () => {
    const req = createURLRequest()
    JSONParameterEncoder.default.encode(req, { name: 'a' })
    expect(req.body).toBe(JSON.stringify({ name: 'a' }))
    expect(req.headers.get('content-type')).toBe('application/json')
  })

  it('throws when JSON.stringify fails', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(() =>
      JSONParameterEncoder.default.encode(createURLRequest(), circular),
    ).toThrow(NetworkingParameterEncodingError)
  })
})


describe('ensureContentType', () => {
  it('sets fallback only when missing', () => {
    const headers = new HTTPHeaders({ 'content-type': 'text/plain' })
    ensureContentType(headers, 'application/json')
    expect(headers.get('content-type')).toBe('text/plain')
    const empty = new HTTPHeaders()
    ensureContentType(empty, 'application/json')
    expect(empty.get('content-type')).toBe('application/json')
  })
})
