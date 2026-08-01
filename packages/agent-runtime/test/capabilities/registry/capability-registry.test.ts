// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  CapabilityAlreadyRegisteredError,
  CapabilityNotFoundError,
  CapabilityRegistry,
  type CapabilityDefinition,
} from '../../../src/capabilities'

/**
 * Builds a minimal capability definition for registry tests.
 */
function makeCapability(overrides: Partial<CapabilityDefinition> = {}): CapabilityDefinition {
  return {
    description: 'Adds numbers together.',
    id: 'test.math',
    toolNames: ['test.add'],
    ...overrides,
  }
}

describe('CapabilityRegistry', () => {
  describe('register', () => {
    it('stores a definition retrievable by id', () => {
      const registry = new CapabilityRegistry()
      const capability = makeCapability()

      registry.register(capability)

      expect(registry.resolve('test.math')).toBe(capability)
    })

    it('throws when the id is already registered', () => {
      const registry = new CapabilityRegistry()
      registry.register(makeCapability())

      expect(() => registry.register(makeCapability())).toThrow(CapabilityAlreadyRegisteredError)
    })
  })

  describe('resolve', () => {
    it('throws when the capability is unknown', () => {
      const registry = new CapabilityRegistry()

      expect(() => registry.resolve('missing')).toThrow(CapabilityNotFoundError)
      expect(() => registry.resolve('missing')).toThrow('Capability not found: missing')
    })
  })

  describe('has', () => {
    it('reports registration state without throwing', () => {
      const registry = new CapabilityRegistry()
      registry.register(makeCapability())

      expect(registry.has('test.math')).toBe(true)
      expect(registry.has('missing')).toBe(false)
    })
  })

  describe('count', () => {
    it('tracks the number of registered definitions', () => {
      const registry = new CapabilityRegistry()

      expect(registry.count).toBe(0)

      registry.register(makeCapability())
      registry.register(makeCapability({ id: 'test.text', toolNames: [] }))

      expect(registry.count).toBe(2)
    })
  })

  describe('values', () => {
    it('returns a registration-order snapshot', () => {
      const registry = new CapabilityRegistry()
      const first = makeCapability()
      const second = makeCapability({ id: 'test.text', toolNames: [] })

      registry.register(first)
      registry.register(second)

      expect(registry.values()).toEqual([first, second])
    })

    it('does not reflect later registrations in earlier snapshots', () => {
      const registry = new CapabilityRegistry()
      registry.register(makeCapability())

      const snapshot = registry.values()
      registry.register(makeCapability({ id: 'test.text' }))

      expect(snapshot).toHaveLength(1)
    })
  })
})
