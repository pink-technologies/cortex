// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { NetworkingResponseSerializationError } from '../../src/error/error'
import { HTTPHeaders } from '../../src/headers/http-headers'
import { JsonSerializer } from '../../src/serializer/json-serializer'
import { createURLRequest } from '../support/url-request'

describe('JsonSerializer', () => {
  const request = createURLRequest()
  const headers = new HTTPHeaders()

  it('parses JSON and applies schema when provided', () => {
    const body = new TextEncoder().encode(JSON.stringify({ id: 1 }))
    expect(new JsonSerializer().serialize(request, 200, headers, body)).toEqual({
      id: 1,
    })
    expect(
      new JsonSerializer(z.object({ id: z.number() })).serialize(
        request,
        200,
        headers,
        body,
      ),
    ).toEqual({ id: 1 })
  })

  it('treats empty body as null', () => {
    expect(
      new JsonSerializer().serialize(request, 200, headers, new Uint8Array()),
    ).toBeNull()
  })

  it('throws on invalid JSON and schema mismatch', () => {
    expect(() =>
      new JsonSerializer().serialize(
        request,
        200,
        headers,
        new TextEncoder().encode('{'),
      ),
    ).toThrow(NetworkingResponseSerializationError)

    expect(() =>
      new JsonSerializer(z.object({ id: z.number() })).serialize(
        request,
        200,
        headers,
        new TextEncoder().encode(JSON.stringify({ id: 'x' })),
      ),
    ).toThrow(NetworkingResponseSerializationError)
  })
})
