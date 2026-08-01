// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NetworkingInvalidURLError } from '../../src/error/error'
import { resolveURL } from '../../src/http/url-convertible'

describe('resolveURL', () => {
  it('accepts string and URL', () => {
    expect(resolveURL('https://example.com/a')).toBe('https://example.com/a')
    expect(resolveURL(new URL('https://example.com/b'))).toBe('https://example.com/b')
  })

  it('throws NetworkingInvalidURLError for invalid URLs', () => {
    expect(() => resolveURL('not a url')).toThrow(NetworkingInvalidURLError)
  })
})
