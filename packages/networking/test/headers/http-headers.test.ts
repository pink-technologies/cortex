// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPHeaders } from '../../src/headers/http-headers'

describe('HTTPHeaders', () => {
  it('normalizes keys and supports get/set/delete/has', () => {
    const headers = new HTTPHeaders({ Accept: 'application/json' })
    expect(headers.get('accept')).toBe('application/json')
    headers.set('Content-Type', 'text/plain')
    expect(headers.has('content-type')).toBe(true)
    headers.delete('ACCEPT')
    expect(headers.has('accept')).toBe(false)
  })

  it('clones and merges from records and headers', () => {
    const a = new HTTPHeaders({ a: '1' })
    const b = a.clone()
    b.merge({ b: '2' })
    b.merge(new HTTPHeaders({ c: '3' }))
    expect(a.toRecord()).toEqual({ a: '1' })
    expect(b.toRecord()).toEqual({ a: '1', b: '2', c: '3' })
  })

  it('imports from Fetch Headers and empty constructor', () => {
    expect(new HTTPHeaders(new Headers({ 'X-Test': '1' })).get('x-test')).toBe('1')
    expect(new HTTPHeaders().toRecord()).toEqual({})
  })
})
