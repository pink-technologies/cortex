// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NodeConfigurationError } from '../../src/configuration/error/error'
import { deepFreeze } from '../../src/configuration/utilities/deep-freeze'

describe('configuration helpers', () => {
  it('preserves the NodeConfigurationError message', () => {
    const error = new NodeConfigurationError('Configuration failed.')
    expect(error.message).toBe('Configuration failed.')
    expect(error.code).toBe('NODE_CONFIGURATION_INVALID')
  })

  it('deepFreeze is idempotent and ignores primitives', () => {
    expect(deepFreeze(null)).toBeNull()
    expect(deepFreeze(42)).toBe(42)

    const value = deepFreeze({ nested: { ok: true }, items: [1, 2] })
    expect(deepFreeze(value)).toBe(value)
    expect(Object.isFrozen(value.items)).toBe(true)
  })
})
