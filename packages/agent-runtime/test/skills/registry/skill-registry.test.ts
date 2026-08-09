// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  SkillAlreadyRegisteredError,
  SkillNotFoundError,
  SkillRegistry,
} from '../../../src/skills'

describe('SkillRegistry', () => {
  it('registers and resolves skills', () => {
    const registry = new SkillRegistry()

    registry.register({
      description: 'Diff skill',
      id: 'code-review-diff',
      prompt: 'Focus on the change set.',
    })

    expect(registry.has('code-review-diff')).toBe(true)
    expect(registry.count).toBe(1)
    expect(registry.resolve('code-review-diff').prompt).toContain('change set')
    expect(registry.values()).toHaveLength(1)
  })

  it('rejects duplicate registration', () => {
    const registry = new SkillRegistry()
    const definition = {
      description: 'Diff skill',
      id: 'code-review-diff',
      prompt: 'Focus on the change set.',
    }

    registry.register(definition)

    expect(() => registry.register(definition)).toThrow(SkillAlreadyRegisteredError)
  })

  it('throws when resolving a missing skill', () => {
    const registry = new SkillRegistry()

    expect(() => registry.resolve('missing')).toThrow(SkillNotFoundError)
  })
})
