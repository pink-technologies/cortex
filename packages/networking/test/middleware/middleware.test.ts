// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  NetworkingConnectionError,
  NetworkingInvalidURLError,
  NetworkingRequestAdaptationError,
  NetworkingRequestCancelledError,
  NetworkingResponseValidationError,
} from '../../src/error/error'
import { Middleware } from '../../src/middleware/middleware'
import { createURLRequest } from '../support/url-request'

describe('Middleware', () => {
  it('runs interceptors and applies retriers', async () => {
    const middleware = new Middleware({
      interceptors: [
        {
          adapt: (request) => {
            request.headers.set('x', '1')
            return request
          },
        },
      ],
      retriers: [{ retry: () => ({ retry: true, delayMs: 0 }) }],
    })
    const adapted = await middleware.adapt(createURLRequest())
    expect(adapted.headers.get('x')).toBe('1')
    await expect(
      middleware.shouldRetry(
        adapted,
        new NetworkingResponseValidationError('x', { statusCode: 500 }),
        0,
      ),
    ).resolves.toBe(true)
  })

  it('wraps interceptor errors and rethrows NetworkingError', async () => {
    await expect(
      new Middleware({
        interceptors: [
          {
            adapt: () => {
              throw new Error('boom')
            },
          },
        ],
      }).adapt(createURLRequest()),
    ).rejects.toBeInstanceOf(NetworkingRequestAdaptationError)

    await expect(
      new Middleware({
        interceptors: [
          {
            adapt: () => {
              throw new NetworkingInvalidURLError('bad')
            },
          },
        ],
      }).adapt(createURLRequest()),
    ).rejects.toBeInstanceOf(NetworkingInvalidURLError)
  })

  it('skips throwing retriers and returns false when none retry', async () => {
    await expect(
      new Middleware({
        retriers: [
          {
            retry: () => {
              throw new Error('nope')
            },
          },
        ],
      }).shouldRetry(createURLRequest(), new NetworkingConnectionError('x'), 0),
    ).resolves.toBe(false)
  })

  it('aborts retry sleep via signal', async () => {
    const controller = new AbortController()
    const middleware = new Middleware({
      retriers: [{ retry: () => ({ retry: true, delayMs: 50 }) }],
    })
    const promise = middleware.shouldRetry(
      createURLRequest(),
      new NetworkingConnectionError('x'),
      0,
      controller.signal,
    )
    controller.abort()
    await expect(promise).rejects.toBeInstanceOf(NetworkingRequestCancelledError)

    const already = new AbortController()
    already.abort()
    await expect(
      new Middleware({
        retriers: [{ retry: () => ({ retry: true, delayMs: 10 }) }],
      }).shouldRetry(
        createURLRequest(),
        new NetworkingConnectionError('x'),
        0,
        already.signal,
      ),
    ).rejects.toBeInstanceOf(NetworkingRequestCancelledError)

    await expect(
      new Middleware({
        retriers: [{ retry: () => ({ retry: true, delayMs: 5 }) }],
      }).shouldRetry(createURLRequest(), new NetworkingConnectionError('x'), 0),
    ).resolves.toBe(true)

    const midAbort = new AbortController()
    const midPromise = new Middleware({
      retriers: [{ retry: () => ({ retry: true, delayMs: 80 }) }],
    }).shouldRetry(
      createURLRequest(),
      new NetworkingConnectionError('x'),
      0,
      midAbort.signal,
    )
    await new Promise((resolve) => setTimeout(resolve, 10))
    midAbort.abort()
    await expect(midPromise).rejects.toBeInstanceOf(NetworkingRequestCancelledError)
  })

  it('honors delayMs <= 0 with already-aborted signal', async () => {
    const already = new AbortController()
    already.abort()
    await expect(
      new Middleware({
        retriers: [{ retry: () => ({ retry: true, delayMs: 0 }) }],
      }).shouldRetry(
        createURLRequest(),
        new NetworkingConnectionError('x'),
        0,
        already.signal,
      ),
    ).rejects.toBeInstanceOf(NetworkingRequestCancelledError)
  })

  it('continues to the next retrier when the first declines', async () => {
    const decisions: number[] = []
    const middleware = new Middleware({
      retriers: [
        {
          retry: () => {
            decisions.push(0)
            return { retry: false }
          },
        },
        {
          retry: () => {
            decisions.push(1)
            return { retry: true, delayMs: 0 }
          },
        },
      ],
    })
    await expect(
      middleware.shouldRetry(
        createURLRequest(),
        new NetworkingConnectionError('x'),
        0,
      ),
    ).resolves.toBe(true)
    expect(decisions).toEqual([0, 1])
  })

  it('uses request.signal when shouldRetry signal is omitted', async () => {
    const controller = new AbortController()
    controller.abort()
    const request = createURLRequest()
    request.signal = controller.signal
    await expect(
      new Middleware({
        retriers: [{ retry: () => ({ retry: true, delayMs: 0 }) }],
      }).shouldRetry(request, new NetworkingConnectionError('x'), 0),
    ).rejects.toBeInstanceOf(NetworkingRequestCancelledError)
  })
})
