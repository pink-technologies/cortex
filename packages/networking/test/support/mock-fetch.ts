// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Builds a mock `fetch` that returns scripted responses in order.
 */
export function createMockFetch(
  responses: Array<{
    body?: string | Uint8Array
    headers?: Record<string, string>
    status?: number
    throwError?: unknown
  }>,
): jest.MockedFunction<typeof fetch> {
  let index = 0
  return jest.fn(async () => {
    const scripted = responses[index++]
    if (!scripted) {
      throw new Error('Unexpected fetch call')
    }
    if (scripted.throwError !== undefined) {
      throw scripted.throwError
    }
    return new Response(scripted.body ?? '', {
      headers: scripted.headers,
      status: scripted.status ?? 200,
    })
  }) as jest.MockedFunction<typeof fetch>
}
