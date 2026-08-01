// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { CapabilityNotFoundError, CapabilityRegistry } from '../../../src/capabilities'
import {
  AgentExecutionToolNotAuthorizedError,
  CapabilityAgentExecutionScopeResolver,
} from '../../../src/execution/scope'
import { SkillNotFoundError, SkillRegistry } from '../../../src/skills'
import { createAgentDefinitionFixture } from '../../fixtures/agent/agent-definition-fixture'

/**
 * Builds a registry pre-populated with math and text capabilities.
 */
function makeRegistry(): CapabilityRegistry {
  const registry = new CapabilityRegistry()

  registry.register({
    description: 'Arithmetic helpers.',
    id: 'test.math',
    toolNames: ['test.add', 'test.subtract'],
  })
  registry.register({
    description: 'Text helpers.',
    id: 'test.text',
    toolNames: ['test.uppercase'],
  })

  return registry
}

describe('CapabilityAgentExecutionScopeResolver', () => {
  describe('capabilityIds', () => {
    it('returns deduplicated declared capabilities when capability use is allowed', async () => {
      const resolver = new CapabilityAgentExecutionScopeResolver(makeRegistry())
      const definition = createAgentDefinitionFixture({
        allowCapabilityUse: true,
        capabilities: ['test.math', 'test.math', 'test.text'],
      })

      const scope = await resolver.resolve(definition, [])

      expect(scope.capabilityIds).toEqual(['test.math', 'test.text'])
    })

    it('returns no capabilities when capability use is disallowed', async () => {
      const resolver = new CapabilityAgentExecutionScopeResolver(makeRegistry())
      const definition = createAgentDefinitionFixture({
        allowCapabilityUse: false,
        capabilities: ['test.math'],
      })

      const scope = await resolver.resolve(definition, [])

      expect(scope.capabilityIds).toEqual([])
    })

    it('throws when a declared capability is not registered', async () => {
      const resolver = new CapabilityAgentExecutionScopeResolver(makeRegistry())
      const definition = createAgentDefinitionFixture({
        allowCapabilityUse: true,
        capabilities: ['test.unknown'],
      })

      await expect(resolver.resolve(definition, [])).rejects.toThrow(CapabilityNotFoundError)
    })
  })

  describe('skillIds', () => {
    it('returns deduplicated declared skills when skill use is allowed', async () => {
      const resolver = new CapabilityAgentExecutionScopeResolver(makeRegistry())
      const definition = createAgentDefinitionFixture({
        allowSkillUse: true,
        skills: ['skill.review', 'skill.review'],
      })

      const scope = await resolver.resolve(definition, [])

      expect(scope.skillIds).toEqual(['skill.review'])
    })

    it('returns no skills when skill use is disallowed', async () => {
      const resolver = new CapabilityAgentExecutionScopeResolver(makeRegistry())
      const definition = createAgentDefinitionFixture({
        allowSkillUse: false,
        skills: ['skill.review'],
      })

      const scope = await resolver.resolve(definition, [])

      expect(scope.skillIds).toEqual([])
    })

    it('throws when a declared skill is missing from the skill registry', async () => {
      const skillRegistry = new SkillRegistry()
      const resolver = new CapabilityAgentExecutionScopeResolver(makeRegistry(), skillRegistry)
      const definition = createAgentDefinitionFixture({
        allowSkillUse: true,
        skills: ['skill.missing'],
      })

      await expect(resolver.resolve(definition, [])).rejects.toThrow(SkillNotFoundError)
    })
  })

  describe('toolNames', () => {
    it('exposes requested tools provided by authorized capabilities', async () => {
      const resolver = new CapabilityAgentExecutionScopeResolver(makeRegistry())
      const definition = createAgentDefinitionFixture({
        allowCapabilityUse: true,
        capabilities: ['test.math', 'test.text'],
      })

      const scope = await resolver.resolve(definition, ['test.add', 'test.uppercase', 'test.add'])

      expect(scope.toolNames).toEqual(['test.add', 'test.uppercase'])
    })

    it('throws when a requested tool is not provided by any authorized capability', async () => {
      const resolver = new CapabilityAgentExecutionScopeResolver(makeRegistry())
      const definition = createAgentDefinitionFixture({
        allowCapabilityUse: true,
        capabilities: ['test.math'],
      })

      await expect(resolver.resolve(definition, ['test.uppercase'])).rejects.toThrow(
        AgentExecutionToolNotAuthorizedError,
      )
      await expect(resolver.resolve(definition, ['test.uppercase'])).rejects.toThrow(
        'Tool not authorized for agent execution: test.uppercase',
      )
    })

    it('throws for requested tools when capability use is disallowed', async () => {
      const resolver = new CapabilityAgentExecutionScopeResolver(makeRegistry())
      const definition = createAgentDefinitionFixture({
        allowCapabilityUse: false,
        capabilities: ['test.math'],
      })

      await expect(resolver.resolve(definition, ['test.add'])).rejects.toThrow(
        AgentExecutionToolNotAuthorizedError,
      )
    })

    it('resolves an empty tool list without consulting authorization', async () => {
      const resolver = new CapabilityAgentExecutionScopeResolver(makeRegistry())
      const definition = createAgentDefinitionFixture({
        allowCapabilityUse: false,
      })

      const scope = await resolver.resolve(definition, [])

      expect(scope.toolNames).toEqual([])
    })
  })
})
