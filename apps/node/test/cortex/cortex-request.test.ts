// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { Request } from '@cortex/networking'
import { CortexRequest } from '../../src/cortex'

/**
 * Builds a networking request double for {@link CortexRequest} tests.
 */
function makeUnderlying(overrides: {
  serializingText?: jest.Mock
  serializingJson?: jest.Mock
} = {}): Request {
  return {
    serializingText: overrides.serializingText ?? jest.fn(),
    serializingJson: overrides.serializingJson ?? jest.fn(),
  } as unknown as Request
}

describe('CortexRequest.response', () => {
  it('resolves when the underlying text response succeeds', async () => {
    const serializingText = jest.fn().mockResolvedValue({
      result: { ok: true, value: '' },
    })

    await expect(new CortexRequest(makeUnderlying({ serializingText })).response()).resolves.toBeUndefined()
    expect(serializingText).toHaveBeenCalledTimes(1)
  })

  it('throws the underlying error when the text response fails', async () => {
    const error = new Error('transport')
    const serializingText = jest.fn().mockResolvedValue({
      result: { ok: false, error },
    })

    await expect(new CortexRequest(makeUnderlying({ serializingText })).response()).rejects.toBe(error)
  })
})

describe('CortexRequest.responseJson', () => {
  it('returns the decoded JSON value when the underlying response succeeds', async () => {
    const serializingJson = jest.fn().mockResolvedValue({
      result: { ok: true, value: { nodeId: 'node-1' } },
    })

    const payload = await new CortexRequest(makeUnderlying({ serializingJson })).responseJson<{
      nodeId: string
    }>()

    expect(payload).toEqual({ nodeId: 'node-1' })
    expect(serializingJson).toHaveBeenCalledTimes(1)
  })

  it('throws the underlying error when the JSON response fails', async () => {
    const error = new Error('bad json')
    const serializingJson = jest.fn().mockResolvedValue({
      result: { ok: false, error },
    })

    await expect(
      new CortexRequest(makeUnderlying({ serializingJson })).responseJson(),
    ).rejects.toBe(error)
  })
})
