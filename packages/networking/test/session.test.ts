// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod } from '../src/http/http-method'
import { Session } from '../src/session'
import { createMockFetch } from './support/mock-fetch'

describe('Session', () => {
  it('uses global fetch by default', async () => {
    const fetchImpl = createMockFetch([{ body: '{}', status: 200 }])
    const spy = jest.spyOn(globalThis, 'fetch').mockImplementation(fetchImpl)
    try {
      const response = await new Session()
        .request('https://example.com/d')
        .serializingJson()
      expect(response.getOrThrow()).toEqual({})
    } finally {
      spy.mockRestore()
    }
  })

  it('creates requests with builder options', async () => {
    const fetchImpl = createMockFetch([{ body: 'ok', status: 200 }])
    const response = await new Session({ fetch: fetchImpl })
      .request('https://example.com/items', {
        headers: { accept: 'text/plain' },
        method: HTTPMethod.POST,
        parameters: { name: 'a' },
      })
      .serializingText()

    expect(response.getOrThrow()).toBe('ok')
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('https://example.com/items'),
      expect.objectContaining({
        method: HTTPMethod.POST,
        headers: expect.objectContaining({ accept: 'text/plain' }),
      }),
    )
  })
})
