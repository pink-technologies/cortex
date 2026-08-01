// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { DefaultAgentExecutionScopeResolver } from '../../../src/execution/scope'
import { createAgentDefinitionFixture } from '../../fixtures/agent'

describe('DefaultAgentExecutionScopeResolver', () => {
  let resolver: DefaultAgentExecutionScopeResolver

  beforeEach(() => {
    resolver = new DefaultAgentExecutionScopeResolver()
  })

  describe('capabilityIds', () => {
    it('includes the declared capabilities when capability use is allowed', async () => {
      const definition = createAgentDefinitionFixture({
        allowCapabilityUse: true,
        capabilities: ['calendar.read', 'calendar.write'],
      })

      const scope = await resolver.resolve(definition, [])

      expect(scope.capabilityIds).toEqual(['calendar.read', 'calendar.write'])
    })

    it('excludes all capabilities when capability use is disallowed', async () => {
      const definition = createAgentDefinitionFixture({
        allowCapabilityUse: false,
        capabilities: ['calendar.read', 'calendar.write'],
      })

      const scope = await resolver.resolve(definition, [])

      expect(scope.capabilityIds).toEqual([])
    })

    it('deduplicates declared capabilities', async () => {
      const definition = createAgentDefinitionFixture({
        allowCapabilityUse: true,
        capabilities: ['calendar.read', 'calendar.read'],
      })

      const scope = await resolver.resolve(definition, [])

      expect(scope.capabilityIds).toEqual(['calendar.read'])
    })
  })

  describe('skillIds', () => {
    it('includes the declared skills when skill use is allowed', async () => {
      const definition = createAgentDefinitionFixture({
        allowSkillUse: true,
        skills: ['summarize', 'translate'],
      })

      const scope = await resolver.resolve(definition, [])

      expect(scope.skillIds).toEqual(['summarize', 'translate'])
    })

    it('excludes all skills when skill use is disallowed', async () => {
      const definition = createAgentDefinitionFixture({
        allowSkillUse: false,
        skills: ['summarize', 'translate'],
      })

      const scope = await resolver.resolve(definition, [])

      expect(scope.skillIds).toEqual([])
    })

    it('deduplicates declared skills', async () => {
      const definition = createAgentDefinitionFixture({
        allowSkillUse: true,
        skills: ['summarize', 'summarize', 'translate'],
      })

      const scope = await resolver.resolve(definition, [])

      expect(scope.skillIds).toEqual(['summarize', 'translate'])
    })
  })

  describe('toolNames', () => {
    it('includes the requested tool names', async () => {
      const definition = createAgentDefinitionFixture()

      const scope = await resolver.resolve(definition, ['test.add', 'test.subtract'])

      expect(scope.toolNames).toEqual(['test.add', 'test.subtract'])
    })

    it('deduplicates requested tool names while preserving order', async () => {
      const definition = createAgentDefinitionFixture()

      const scope = await resolver.resolve(definition, [
        'test.add',
        'test.subtract',
        'test.add',
      ])

      expect(scope.toolNames).toEqual(['test.add', 'test.subtract'])
    })

    it('resolves an empty tool allowlist for an empty request', async () => {
      const definition = createAgentDefinitionFixture()

      const scope = await resolver.resolve(definition, [])

      expect(scope.toolNames).toEqual([])
    })
  })
})
