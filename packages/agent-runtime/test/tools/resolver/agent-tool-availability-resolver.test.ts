// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import {
  AgentToolAllowlistAuthorizationPolicy,
  AgentToolAvailabilityResolver,
  AgentToolEffect,
  AgentToolIdempotency,
  AgentToolRegistry,
  type AgentTool,
  type AgentToolAuthorizationPolicy,
} from '../../../src/tools'
import { createAgentExecutionContextFixture } from '../../fixtures/execution'

/**
 * Creates a minimal registered tool with the given name for availability tests.
 */
function createNamedTool(name: string, description = `Tool ${name}.`): AgentTool<Record<string, never>, undefined> {
  return {
    description,
    inputSchema: z.object({}),
    metadata: {
      effect: AgentToolEffect.Read,
      idempotency: AgentToolIdempotency.Idempotent,
      permissions: [],
    },
    name,
    outputSchema: z.undefined(),
    async execute(): Promise<undefined> {
      return undefined
    },
  }
}

describe('AgentToolAvailabilityResolver', () => {
  describe('Given registered tools and an allowlist policy', () => {
    describe('When only some tools are authorized', () => {
      it('Then returns only authorized definitions', async () => {
        const registry = new AgentToolRegistry()
        registry.register(createNamedTool('test.alpha'))
        registry.register(createNamedTool('test.beta'))
        registry.register(createNamedTool('test.gamma'))

        const resolver = new AgentToolAvailabilityResolver(
          registry,
          new AgentToolAllowlistAuthorizationPolicy(['test.alpha', 'test.gamma']),
        )

        const definitions = await resolver.resolve(createAgentExecutionContextFixture())

        expect(definitions.map((definition) => definition.name)).toEqual(['test.alpha', 'test.gamma'])
        expect(definitions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              description: 'Tool test.alpha.',
              name: 'test.alpha',
            }),
            expect.objectContaining({
              description: 'Tool test.gamma.',
              name: 'test.gamma',
            }),
          ]),
        )
      })

      it('Then excludes denied definitions', async () => {
        const registry = new AgentToolRegistry()
        registry.register(createNamedTool('test.allowed'))
        registry.register(createNamedTool('test.denied'))

        const resolver = new AgentToolAvailabilityResolver(
          registry,
          new AgentToolAllowlistAuthorizationPolicy(['test.allowed']),
        )

        const definitions = await resolver.resolve(createAgentExecutionContextFixture())

        expect(definitions.map((definition) => definition.name)).toEqual(['test.allowed'])
        expect(definitions.map((definition) => definition.name)).not.toContain('test.denied')
      })

      it('Then preserves registry order among authorized tools', async () => {
        const registry = new AgentToolRegistry()
        registry.register(createNamedTool('test.first'))
        registry.register(createNamedTool('test.second'))
        registry.register(createNamedTool('test.third'))

        const resolver = new AgentToolAvailabilityResolver(
          registry,
          new AgentToolAllowlistAuthorizationPolicy(['test.third', 'test.first']),
        )

        const definitions = await resolver.resolve(createAgentExecutionContextFixture())

        expect(definitions.map((definition) => definition.name)).toEqual(['test.first', 'test.third'])
      })
    })

    describe('When nothing is authorized', () => {
      it('Then returns an empty array', async () => {
        const registry = new AgentToolRegistry()
        registry.register(createNamedTool('test.alpha'))
        registry.register(createNamedTool('test.beta'))

        const resolver = new AgentToolAvailabilityResolver(
          registry,
          new AgentToolAllowlistAuthorizationPolicy([]),
        )

        await expect(resolver.resolve(createAgentExecutionContextFixture())).resolves.toEqual([])
      })
    })
  })

  describe('Given an already cancelled execution context', () => {
    describe('When resolve is called', () => {
      it('Then throws', async () => {
        const controller = new AbortController()
        controller.abort()

        const registry = new AgentToolRegistry()
        registry.register(createNamedTool('test.alpha'))

        const resolver = new AgentToolAvailabilityResolver(
          registry,
          new AgentToolAllowlistAuthorizationPolicy(['test.alpha']),
        )

        await expect(
          resolver.resolve(createAgentExecutionContextFixture({ signal: controller.signal })),
        ).rejects.toThrow()
      })
    })
  })

  describe('Given authorization that aborts the signal before completing', () => {
    describe('When resolve awaits the policy', () => {
      it('Then throws when cancelled during authorizationPolicy.allows()', async () => {
        const controller = new AbortController()
        const registry = new AgentToolRegistry()
        registry.register(createNamedTool('test.alpha'))

        const authorizationPolicy: AgentToolAuthorizationPolicy = {
          async allows() {
            controller.abort()
            return true
          },
        }

        const resolver = new AgentToolAvailabilityResolver(registry, authorizationPolicy)

        await expect(
          resolver.resolve(createAgentExecutionContextFixture({ signal: controller.signal })),
        ).rejects.toThrow()
      })
    })
  })

  describe('Given an authorization policy that fails', () => {
    describe('When resolve is called', () => {
      it('Then propagates authorization-policy failures', async () => {
        const registry = new AgentToolRegistry()
        registry.register(createNamedTool('test.alpha'))

        const authorizationPolicy: AgentToolAuthorizationPolicy = {
          async allows() {
            throw new Error('authorization policy failed')
          },
        }

        const resolver = new AgentToolAvailabilityResolver(registry, authorizationPolicy)

        await expect(resolver.resolve(createAgentExecutionContextFixture())).rejects.toThrow(
          'authorization policy failed',
        )
      })
    })
  })
})
