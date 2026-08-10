// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NodeConfigurationError } from '../../src/configuration/error/node-configuration-error'
import { deepFreeze } from '../../src/configuration/utilities/deep-freeze'

describe('configuration utilities', () => {
  it('deepFreeze is idempotent and ignores primitives', () => {
    expect(deepFreeze(null)).toBeNull()
    expect(deepFreeze(42)).toBe(42)
    expect(deepFreeze('text')).toBe('text')

    const value = deepFreeze({ nested: { ok: true }, items: [1, 2] })
    expect(deepFreeze(value)).toBe(value)
    expect(Object.isFrozen(value.items)).toBe(true)
  })

  it('preserves the NodeConfigurationError message and code', () => {
    const error = new NodeConfigurationError('Configuration failed.')
    expect(error.message).toBe('Configuration failed.')
    expect(error.code).toBe('NODE_CONFIGURATION_INVALID')
  })
})
