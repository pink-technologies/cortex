// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { KeyedRegistry } from '../../src/registry/keyed-registry'

type Item = {
  readonly id: string
  readonly label: string
}

class TestRegistry extends KeyedRegistry<Item> {}

function makeRegistry(): TestRegistry {
  return new TestRegistry()
}

describe('KeyedRegistry', () => {
  it('registers and resolves values by id', () => {
    const registry = makeRegistry()
    const item = { id: 'a', label: 'Alpha' }

    registry.register(item)

    expect(registry.has('a')).toBe(true)
    expect(registry.resolve('a')).toBe(item)
    expect(registry.count).toBe(1)
  })

  it('throws on duplicate registration', () => {
    const registry = makeRegistry()
    registry.register({ id: 'a', label: 'Alpha' })

    expect(() => registry.register({ id: 'a', label: 'Other' })).toThrow(
      'Value with id a already registered',
    )
  })

  it('throws when resolve misses', () => {
    const registry = makeRegistry()

    expect(() => registry.resolve('missing')).toThrow('Value with id missing not found')
  })

  it('returns a registration-order snapshot that is not live-updated', () => {
    const registry = makeRegistry()
    const first = { id: 'a', label: 'Alpha' }
    const second = { id: 'b', label: 'Beta' }

    registry.register(first)
    const snapshot = registry.values()
    registry.register(second)

    expect(snapshot).toEqual([first])
    expect(registry.values()).toEqual([first, second])
  })

  it('reports absence without throwing', () => {
    const registry = makeRegistry()

    expect(registry.has('missing')).toBe(false)
    expect(registry.count).toBe(0)
  })
})
