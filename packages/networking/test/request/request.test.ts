// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import {
  NetworkingConnectionError,
  NetworkingRequestAdaptationError,
  NetworkingRequestCancelledError,
  NetworkingResponseValidationError,
} from '../../src/error/error'
import { Middleware } from '../../src/middleware/middleware'
import type { Monitor } from '../../src/monitor/monitor'
import { Session } from '../../src/session'
import { createMockFetch } from '../support/mock-fetch'

describe('Request', () => {
  it('treats validation as opt-in', async () => {
    const without = await new Session({
      fetch: createMockFetch([{ body: 'err', status: 500 }]),
    })
      .request('https://api.example.com/x')
      .serializingText()
    expect(without.isSuccess).toBe(true)
    expect(without.getOrThrow()).toBe('err')

    await expect(
      new Session({
        fetch: createMockFetch([{ body: 'err', status: 500 }]),
      })
        .request('https://api.example.com/x')
        .validate()
        .serializingText(),
    ).rejects.toBeInstanceOf(NetworkingResponseValidationError)
  })

  it('returns NetworkResponse when interceptor adapt fails', async () => {
    const response = await new Session({
      fetch: createMockFetch([{ body: 'ok', status: 200 }]),
      middleware: new Middleware({
        interceptors: [
          {
            adapt: () => {
              throw new Error('adapter boom')
            },
          },
        ],
      }),
    })
      .request('https://api.example.com/adapt')
      .serializingText()

    expect(response.isSuccess).toBe(false)
    if (!response.result.ok) {
      expect(response.result.error).toBeInstanceOf(NetworkingRequestAdaptationError)
    }

    const nonError = await new Session({
      fetch: createMockFetch([{ body: 'ok', status: 200 }]),
      middleware: new Middleware({
        interceptors: [
          {
            adapt: () => {
              throw 'plain-string'
            },
          },
        ],
      }),
    })
      .request('https://api.example.com/adapt-string')
      .serializingText()
    expect(nonError.isSuccess).toBe(false)
    if (!nonError.result.ok) {
      expect(nonError.result.error).toBeInstanceOf(NetworkingRequestAdaptationError)
    }
  })

  it('returns NetworkResponse when retry sleep is aborted', async () => {
    const controller = new AbortController()
    const fetchImpl = createMockFetch([
      { throwError: new Error('network down') },
      { body: 'ok', status: 200 },
    ])
    const promise = new Session({
      fetch: fetchImpl,
      middleware: new Middleware({
        retriers: [{ retry: () => ({ retry: true, delayMs: 80 }) }],
      }),
    })
      .request('https://api.example.com/retry-abort', { signal: controller.signal })
      .serializingText()

    await new Promise((resolve) => setTimeout(resolve, 10))
    controller.abort()

    const response = await promise
    expect(response.isSuccess).toBe(false)
    if (!response.result.ok) {
      expect(response.result.error).toBeInstanceOf(NetworkingRequestCancelledError)
    }
  })

  it('throws validation errors with status and response body', async () => {
    await expect(
      new Session({
        fetch: createMockFetch([
          {
            body: 'nope',
            headers: { 'x-request-id': 'abc', 'content-type': 'text/plain' },
            status: 500,
          },
        ]),
      })
        .request('https://api.example.com/headers')
        .validate()
        .serializingText(),
    ).rejects.toMatchObject({
      responseBody: 'nope',
      statusCode: 500,
    })
  })

  it('does not fail the request when monitor hooks throw', async () => {
    const monitor: Monitor = {
      requestDidStart: () => {
        throw new Error('start')
      },
      requestDidComplete: () => {
        throw new Error('complete')
      },
      requestDidFail: () => {
        throw new Error('fail')
      },
    }

    const success = await new Session({
      fetch: createMockFetch([{ body: 'ok', status: 200 }]),
      monitor,
    })
      .request('https://api.example.com/m')
      .serializingText()
    expect(success.isSuccess).toBe(true)
    expect(success.getOrThrow()).toBe('ok')

    await expect(
      new Session({
        fetch: createMockFetch([{ body: 'err', status: 500 }]),
        monitor,
      })
        .request('https://api.example.com/m2')
        .validate()
        .serializingText(),
    ).rejects.toBeInstanceOf(NetworkingResponseValidationError)
  })

  it('maps connection, abort, and serializer failures to NetworkResponse', async () => {
    const down = await new Session({
      fetch: createMockFetch([{ throwError: new Error('network down') }]),
    })
      .request('https://api.example.com/down')
      .serializingText()
    expect(down.isSuccess).toBe(false)
    if (!down.result.ok) {
      expect(down.result.error).toBeInstanceOf(NetworkingConnectionError)
    }

    const stringFail = await new Session({
      fetch: createMockFetch([{ throwError: 'string-failure' }]),
    })
      .request('https://api.example.com/string')
      .serializingText()
    expect(stringFail.isSuccess).toBe(false)

    const abortErr = new Error('aborted')
    abortErr.name = 'AbortError'
    const abortedFetch = await new Session({
      fetch: createMockFetch([{ throwError: abortErr }]),
    })
      .request('https://api.example.com/ab')
      .serializingText()
    expect(abortedFetch.isSuccess).toBe(false)
    if (!abortedFetch.result.ok) {
      expect(abortedFetch.result.error).toBeInstanceOf(NetworkingRequestCancelledError)
    }

    const custom = await new Session({
      fetch: createMockFetch([{ body: 'x', status: 200 }]),
    })
      .request('https://example.com/c')
      .serializingWith({
        serialize: () => {
          throw 'nope'
        },
      })
    expect(custom.isSuccess).toBe(false)

    const serErr = await new Session({
      fetch: createMockFetch([{ body: 'x', status: 200 }]),
    })
      .request('https://example.com/e')
      .serializingWith({
        serialize: () => {
          throw new Error('bad serialize')
        },
      })
    expect(serErr.isSuccess).toBe(false)

    const schemaFail = await new Session({
      fetch: createMockFetch([{ body: JSON.stringify({ id: 'x' }), status: 200 }]),
    })
      .request('https://example.com/s')
      .serializing(z.object({ id: z.number() }))
    expect(schemaFail.isSuccess).toBe(false)
  })

  it('cancels in-flight requests and respects aborted signals', async () => {
    const fetchImpl = jest.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal
          if (signal?.aborted) {
            reject(new DOMException('aborted', 'AbortError'))
            return
          }
          signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'))
          })
        }),
    ) as unknown as typeof fetch

    const session = new Session({ fetch: fetchImpl })
    const request = session.request('https://api.example.com/slow')
    const promise = request.serializingText()
    await Promise.resolve()
    request.cancel()
    const response = await promise
    expect(response.isSuccess).toBe(false)
    if (!response.result.ok) {
      expect(response.result.error).toBeInstanceOf(NetworkingRequestCancelledError)
    }

    const controller = new AbortController()
    controller.abort()
    const aborted = await new Session({
      fetch: createMockFetch([{ body: 'x', status: 200 }]),
    })
      .request('https://api.example.com/a', { signal: controller.signal })
      .serializingText()
    expect(aborted.isSuccess).toBe(false)
  })

  it('wires later abort from caller signal', async () => {
    const controller = new AbortController()
    const fetchImpl = jest.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'))
          })
        }),
    ) as unknown as typeof fetch
    const promise = new Session({ fetch: fetchImpl })
      .request('https://api.example.com/later', { signal: controller.signal })
      .serializingText()
    await Promise.resolve()
    controller.abort()
    expect((await promise).isSuccess).toBe(false)
  })

  it('retries after failure and re-adapts before the next attempt', async () => {
    let adaptCount = 0
    const fetchImpl = createMockFetch([
      { body: 'err', status: 503 },
      { body: JSON.stringify({ ok: true }), status: 200 },
    ])
    const response = await new Session({
      fetch: fetchImpl,
      middleware: new Middleware({
        interceptors: [
          {
            adapt: (request) => {
              adaptCount += 1
              request.headers.set('authorization', 'Bearer t')
              return request
            },
          },
        ],
        retriers: [
          {
            retry: (_req, error, count) =>
              error.statusCode !== undefined &&
              error.statusCode >= 500 &&
              count < 2
                ? { retry: true, delayMs: 0 }
                : { retry: false },
          },
        ],
      }),
    })
      .request('https://api.example.com/retry')
      .validate()
      .serializing(z.object({ ok: z.boolean() }))

    expect(response.getOrThrow()).toEqual({ ok: true })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(adaptCount).toBe(2)
  })

  it('returns adaptation failure when re-adapt after retry fails', async () => {
    let adaptCount = 0
    const response = await new Session({
      fetch: createMockFetch([{ body: 'err', status: 503 }]),
      middleware: new Middleware({
        interceptors: [
          {
            adapt: (request) => {
              adaptCount += 1
              if (adaptCount > 1) {
                throw new Error('re-adapt failed')
              }
              return request
            },
          },
        ],
        retriers: [{ retry: () => ({ retry: true, delayMs: 0 }) }],
      }),
    })
      .request('https://api.example.com/re-adapt')
      .validate()
      .serializingText()

    expect(response.isSuccess).toBe(false)
    if (!response.result.ok) {
      expect(response.result.error).toBeInstanceOf(NetworkingRequestAdaptationError)
    }
  })

  it('surfaces arrayBuffer read failures as connection errors', async () => {
    const fetchImpl = jest.fn(async () => {
      const response = {
        arrayBuffer: async () => {
          throw new Error('body read failed')
        },
        headers: new Headers({ 'content-type': 'text/plain' }),
        status: 200,
      }
      return response as unknown as Response
    }) as unknown as typeof fetch

    const result = await new Session({ fetch: fetchImpl })
      .request('https://api.example.com/body')
      .serializingText()
    expect(result.isSuccess).toBe(false)
    if (!result.result.ok) {
      expect(result.result.error).toBeInstanceOf(NetworkingConnectionError)
      expect(result.result.error.message).toContain('body read failed')
    }

    const nonErrorBody = await new Session({
      fetch: jest.fn(async () =>
        ({
          arrayBuffer: async () => {
            throw 'read-failed'
          },
          headers: new Headers(),
          status: 200,
        }) as unknown as Response,
      ) as unknown as typeof fetch,
    })
      .request('https://api.example.com/body2')
      .serializingText()
    expect(nonErrorBody.isSuccess).toBe(false)
  })

  it('maps non-Error throws from middleware into NetworkResponse', async () => {
    const adaptError = await new Session({
      fetch: createMockFetch([{ body: 'ok', status: 200 }]),
      middleware: {
        adapt: async () => {
          throw new Error('raw adapt')
        },
        shouldRetry: async () => false,
      } as unknown as Middleware,
    })
      .request('https://api.example.com/adapt-error')
      .serializingText()
    expect(adaptError.isSuccess).toBe(false)
    if (!adaptError.result.ok) {
      expect(adaptError.result.error).toBeInstanceOf(NetworkingConnectionError)
      expect(adaptError.result.error.message).toBe('raw adapt')
    }

    const adaptFail = await new Session({
      fetch: createMockFetch([{ body: 'ok', status: 200 }]),
      middleware: {
        adapt: async () => {
          throw 42
        },
        shouldRetry: async () => false,
      } as unknown as Middleware,
    })
      .request('https://api.example.com/adapt-number')
      .serializingText()
    expect(adaptFail.isSuccess).toBe(false)
    if (!adaptFail.result.ok) {
      expect(adaptFail.result.error).toBeInstanceOf(NetworkingConnectionError)
      expect(adaptFail.result.error.message).toBe('Request failed')
    }

    const retryFail = await new Session({
      fetch: createMockFetch([{ throwError: new Error('down') }]),
      middleware: {
        adapt: async (request) => request,
        shouldRetry: async () => {
          throw 'retry-blew-up'
        },
      } as unknown as Middleware,
    })
      .request('https://api.example.com/retry-throw')
      .serializingText()
    expect(retryFail.isSuccess).toBe(false)
    if (!retryFail.result.ok) {
      expect(retryFail.result.error.message).toBe('Request failed')
    }
  })
})
