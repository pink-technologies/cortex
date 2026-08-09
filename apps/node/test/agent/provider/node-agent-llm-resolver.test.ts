// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentLLMDefinition } from '@cortex/agent-runtime'
import type { LLM, LLMFactory } from '@cortex/llm'
import { LLMProviderType } from '@cortex/llm'
import {
  NodeLLMProviderNotConfiguredError,
  NodeLLMProviderNotSupportedError,
} from '../../../src/agent/provider/error/error'
import { NodeAgentLLMResolver } from '../../../src/agent/provider/node-agent-llm-resolver'
import type { NodeLLMConfiguration } from '../../../src/configuration'

function createDefinition(
  overrides: Partial<AgentLLMDefinition> = {},
): AgentLLMDefinition {
  return {
    maximumOutputTokens: 1_024,
    model: 'gpt-4.1-mini',
    provider: LLMProviderType.OpenAI,
    temperature: 0,
    ...overrides,
  }
}

function createFactory(client: LLM = { complete: jest.fn() } as unknown as LLM): jest.Mocked<LLMFactory> {
  return {
    create: jest.fn().mockReturnValue(client),
  }
}

describe('NodeAgentLLMResolver', () => {
  describe('OpenAI resolution', () => {
    it('creates an OpenAI client using the configured API key', async () => {
      const factory = createFactory()
      const resolver = new NodeAgentLLMResolver({ openAI: { apiKey: 'openai-key' } }, factory)

      await resolver.resolve(createDefinition())

      expect(factory.create).toHaveBeenCalledWith(LLMProviderType.OpenAI, {
        apiKey: 'openai-key',
        provider: LLMProviderType.OpenAI,
      })
    })

    it('passes OpenAI as the provider type to the LLM factory', async () => {
      const factory = createFactory()
      const resolver = new NodeAgentLLMResolver({ openAI: { apiKey: 'openai-key' } }, factory)

      await resolver.resolve(createDefinition())

      expect(factory.create.mock.calls[0]?.[0]).toBe(LLMProviderType.OpenAI)
    })

    it('returns the client created by the LLM factory', async () => {
      const client = { complete: jest.fn() } as unknown as LLM
      const factory = createFactory(client)
      const resolver = new NodeAgentLLMResolver({ openAI: { apiKey: 'openai-key' } }, factory)

      await expect(resolver.resolve(createDefinition())).resolves.toBe(client)
    })
  })

  describe('missing configuration', () => {
    it('throws NodeLLMProviderNotConfiguredError when OpenAI is not configured', async () => {
      const factory = createFactory()
      const resolver = new NodeAgentLLMResolver({}, factory)

      await expect(resolver.resolve(createDefinition())).rejects.toBeInstanceOf(
        NodeLLMProviderNotConfiguredError,
      )
    })

    it('includes the requested provider in the not-configured error', async () => {
      const factory = createFactory()
      const resolver = new NodeAgentLLMResolver({}, factory)

      await expect(resolver.resolve(createDefinition())).rejects.toMatchObject({
        provider: LLMProviderType.OpenAI,
      })
    })

    it('does not invoke the LLM factory when OpenAI is not configured', async () => {
      const factory = createFactory()
      const resolver = new NodeAgentLLMResolver({}, factory)

      await expect(resolver.resolve(createDefinition())).rejects.toBeInstanceOf(
        NodeLLMProviderNotConfiguredError,
      )
      expect(factory.create).not.toHaveBeenCalled()
    })
  })

  describe('unsupported provider', () => {
    const anthropicConfiguration: NodeLLMConfiguration = {
      anthropic: { apiKey: 'anthropic-key' },
    }

    it('throws NodeLLMProviderNotSupportedError when Anthropic is requested', async () => {
      const factory = createFactory()
      const resolver = new NodeAgentLLMResolver(anthropicConfiguration, factory)

      await expect(
        resolver.resolve(createDefinition({ provider: LLMProviderType.Anthropic, model: 'claude-sonnet' })),
      ).rejects.toBeInstanceOf(NodeLLMProviderNotSupportedError)
    })

    it('includes Anthropic in the unsupported-provider error', async () => {
      const factory = createFactory()
      const resolver = new NodeAgentLLMResolver(anthropicConfiguration, factory)

      await expect(
        resolver.resolve(createDefinition({ provider: LLMProviderType.Anthropic, model: 'claude-sonnet' })),
      ).rejects.toMatchObject({
        provider: LLMProviderType.Anthropic,
      })
    })

    it('does not invoke the LLM factory for an unsupported provider', async () => {
      const factory = createFactory()
      const resolver = new NodeAgentLLMResolver(anthropicConfiguration, factory)

      await expect(
        resolver.resolve(createDefinition({ provider: LLMProviderType.Anthropic, model: 'claude-sonnet' })),
      ).rejects.toBeInstanceOf(NodeLLMProviderNotSupportedError)
      expect(factory.create).not.toHaveBeenCalled()
    })
  })

  describe('caching', () => {
    it('returns the cached client for repeated provider resolutions', async () => {
      const client = { complete: jest.fn() } as unknown as LLM
      const factory = createFactory(client)
      const resolver = new NodeAgentLLMResolver({ openAI: { apiKey: 'openai-key' } }, factory)

      const first = await resolver.resolve(createDefinition())
      const second = await resolver.resolve(createDefinition())

      expect(first).toBe(client)
      expect(second).toBe(client)
    })

    it('creates the provider client only once', async () => {
      const factory = createFactory()
      const resolver = new NodeAgentLLMResolver({ openAI: { apiKey: 'openai-key' } }, factory)

      await resolver.resolve(createDefinition())
      await resolver.resolve(createDefinition())

      expect(factory.create).toHaveBeenCalledTimes(1)
    })

    it('shares one initialization between concurrent resolutions', async () => {
      let release!: (client: LLM) => void
      const client = { complete: jest.fn() } as unknown as LLM
      const factory: jest.Mocked<LLMFactory> = {
        create: jest.fn().mockImplementation(
          () =>
            new Promise<LLM>((resolve) => {
              release = resolve
            }),
        ),
      }
      const resolver = new NodeAgentLLMResolver({ openAI: { apiKey: 'openai-key' } }, factory)

      const first = resolver.resolve(createDefinition())
      const second = resolver.resolve(createDefinition())

      expect(factory.create).toHaveBeenCalledTimes(1)

      release(client)

      await expect(Promise.all([first, second])).resolves.toEqual([client, client])
    })

    it('uses the same client for agents using different models from the same provider', async () => {
      const factory = createFactory()
      const resolver = new NodeAgentLLMResolver({ openAI: { apiKey: 'openai-key' } }, factory)

      const first = await resolver.resolve(createDefinition({ model: 'gpt-4.1-mini' }))
      const second = await resolver.resolve(createDefinition({ model: 'gpt-4.1' }))

      expect(first).toBe(second)
      expect(factory.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('failed initialization', () => {
    it('propagates an LLM factory initialization failure', async () => {
      const factory: jest.Mocked<LLMFactory> = {
        create: jest.fn().mockImplementation(() => {
          throw new Error('provider unavailable')
        }),
      }
      const resolver = new NodeAgentLLMResolver({ openAI: { apiKey: 'openai-key' } }, factory)

      await expect(resolver.resolve(createDefinition())).rejects.toThrow('provider unavailable')
    })

    it('removes a failed initialization from the cache', async () => {
      const factory: jest.Mocked<LLMFactory> = {
        create: jest
          .fn()
          .mockImplementationOnce(() => {
            throw new Error('provider unavailable')
          })
          .mockReturnValue({ complete: jest.fn() } as unknown as LLM),
      }
      const resolver = new NodeAgentLLMResolver({ openAI: { apiKey: 'openai-key' } }, factory)

      await expect(resolver.resolve(createDefinition())).rejects.toThrow('provider unavailable')
      await expect(resolver.resolve(createDefinition())).resolves.toBeDefined()
    })

    it('retries provider initialization after a previous failure', async () => {
      const client = { complete: jest.fn() } as unknown as LLM
      const factory: jest.Mocked<LLMFactory> = {
        create: jest
          .fn()
          .mockImplementationOnce(() => {
            throw new Error('provider unavailable')
          })
          .mockReturnValue(client),
      }
      const resolver = new NodeAgentLLMResolver({ openAI: { apiKey: 'openai-key' } }, factory)

      await expect(resolver.resolve(createDefinition())).rejects.toThrow('provider unavailable')
      await expect(resolver.resolve(createDefinition())).resolves.toBe(client)
      expect(factory.create).toHaveBeenCalledTimes(2)
    })

    it('caches the client after a successful retry', async () => {
      const client = { complete: jest.fn() } as unknown as LLM
      const factory: jest.Mocked<LLMFactory> = {
        create: jest
          .fn()
          .mockImplementationOnce(() => {
            throw new Error('provider unavailable')
          })
          .mockReturnValue(client),
      }
      const resolver = new NodeAgentLLMResolver({ openAI: { apiKey: 'openai-key' } }, factory)

      await expect(resolver.resolve(createDefinition())).rejects.toThrow('provider unavailable')
      await resolver.resolve(createDefinition())
      await resolver.resolve(createDefinition())

      expect(factory.create).toHaveBeenCalledTimes(2)
    })
  })

  describe('data integrity and security', () => {
    it('does not mutate the agent LLM definition', async () => {
      const factory = createFactory()
      const resolver = new NodeAgentLLMResolver({ openAI: { apiKey: 'openai-key' } }, factory)
      const definition = createDefinition()
      const snapshot = { ...definition }

      await resolver.resolve(definition)

      expect(definition).toEqual(snapshot)
    })

    it('does not include the API key in a not-configured error', async () => {
      const factory = createFactory()
      const resolver = new NodeAgentLLMResolver({}, factory)

      try {
        await resolver.resolve(createDefinition())
        throw new Error('expected resolve to reject')
      } catch (error) {
        expect(error).toBeInstanceOf(NodeLLMProviderNotConfiguredError)
        expect(JSON.stringify(error)).not.toContain('openai-key')
        expect(String(error)).not.toContain('openai-key')
      }
    })

    it('does not include the API key in an unsupported-provider error', async () => {
      const factory = createFactory()
      const resolver = new NodeAgentLLMResolver(
        { anthropic: { apiKey: 'anthropic-secret-key' } },
        factory,
      )

      try {
        await resolver.resolve(
          createDefinition({ provider: LLMProviderType.Anthropic, model: 'claude-sonnet' }),
        )
        throw new Error('expected resolve to reject')
      } catch (error) {
        expect(error).toBeInstanceOf(NodeLLMProviderNotSupportedError)
        expect(JSON.stringify(error)).not.toContain('anthropic-secret-key')
        expect(String(error)).not.toContain('anthropic-secret-key')
      }
    })
  })
})
