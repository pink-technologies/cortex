// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  AgentDefinitionRegistry,
  AgentFactory,
  AgentRuntime,
  AgentToolExecutor,
  AgentToolRegistry,
  Kernel,
} from '@cortex/agent-runtime'
import { LLMFactoryImpl } from '@cortex/llm'
import { Injectable, Module } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { AgentModule } from '../../src/agent/agent.module'
import { NodeAgentLLMResolver } from '../../src/agent/provider'
import {
  createNodeConfiguration,
  NODE_CONFIGURATION,
  type NodeConfiguration,
} from '../../src/configuration'

@Injectable()
class AgentModuleConsumer {
  constructor(
    readonly agentFactory: AgentFactory,
    readonly agentRuntime: AgentRuntime,
    readonly llmResolver: NodeAgentLLMResolver,
  ) {}
}

@Module({
  imports: [AgentModule],
  providers: [AgentModuleConsumer],
})
class AgentModuleConsumerModule {}

describe('AgentModule', () => {
  const configuration: NodeConfiguration = createNodeConfiguration({
    CORTEX_API_URL: 'https://api.cortex.example',
    CORTEX_NODE_ID: 'node-1',
    CORTEX_NODE_NAME: 'worker',
    CORTEX_NODE_VERSION: '1.0.0',
    OPENAI_API_KEY: 'openai-key',
  })

  async function createModule(): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [AgentModule],
    })
      .overrideProvider(NODE_CONFIGURATION)
      .useValue(configuration)
      .compile()
  }

  describe('provider registration', () => {
    it('resolves LLMFactoryImpl', async () => {
      const module = await createModule()

      expect(module.get(LLMFactoryImpl)).toBeInstanceOf(LLMFactoryImpl)
    })

    it('resolves NodeAgentLLMResolver', async () => {
      const module = await createModule()

      expect(module.get(NodeAgentLLMResolver)).toBeInstanceOf(NodeAgentLLMResolver)
    })

    it('resolves AgentFactory', async () => {
      const module = await createModule()

      expect(module.get(AgentFactory)).toBeInstanceOf(AgentFactory)
    })

    it('resolves AgentRuntime', async () => {
      const module = await createModule()

      expect(module.get(AgentRuntime)).toBeInstanceOf(AgentRuntime)
    })

    it('resolves AgentDefinitionRegistry', async () => {
      const module = await createModule()

      expect(module.get(AgentDefinitionRegistry)).toBeInstanceOf(AgentDefinitionRegistry)
    })

    it('resolves AgentToolRegistry', async () => {
      const module = await createModule()

      expect(module.select(AgentModule).get(AgentToolRegistry)).toBeInstanceOf(AgentToolRegistry)
    })

    it('uses LLMFactoryImpl as the runtime injection token', async () => {
      const module = await createModule()
      const factory = module.get(LLMFactoryImpl)
      const resolver = module.get(NodeAgentLLMResolver)

      expect(factory).toBeInstanceOf(LLMFactoryImpl)
      expect(resolver).toBeInstanceOf(NodeAgentLLMResolver)
    })

    it('resolves AgentRuntime composition providers', async () => {
      const module = await createModule()

      expect(module.get(AgentToolExecutor)).toBeInstanceOf(AgentToolExecutor)
      expect(module.get(Kernel)).toBeInstanceOf(Kernel)
      expect(module.get(AgentRuntime)).toBeInstanceOf(AgentRuntime)
    })
  })

  describe('dependency composition', () => {
    it('constructs NodeAgentLLMResolver using configuration.llm', async () => {
      const module = await createModule()
      const resolver = module.get(NodeAgentLLMResolver)
      const factory = module.get(LLMFactoryImpl)
      const createSpy = jest.spyOn(factory, 'create')

      await resolver.resolve({
        maximumOutputTokens: 1_024,
        model: 'gpt-4.1-mini',
        provider: 'openai',
        temperature: 0,
      })

      expect(createSpy).toHaveBeenCalledWith('openai', {
        apiKey: 'openai-key',
        provider: 'openai',
      })
    })

    it('constructs AgentFactory using NodeAgentLLMResolver', async () => {
      const module = await createModule()
      const resolver = module.get(NodeAgentLLMResolver)
      const agentFactory = module.get(AgentFactory)

      expect(agentFactory).toBeInstanceOf(AgentFactory)
      expect(Reflect.get(agentFactory, 'llmResolver')).toBe(resolver)
    })

    it('uses singleton instances within the module scope', async () => {
      const module = await createModule()

      expect(module.get(NodeAgentLLMResolver)).toBe(module.get(NodeAgentLLMResolver))
      expect(module.get(AgentFactory)).toBe(module.get(AgentFactory))
      expect(module.get(LLMFactoryImpl)).toBe(module.get(LLMFactoryImpl))
    })

    it('uses singleton runtime dependencies', async () => {
      const module = await createModule()
      const agentModule = module.select(AgentModule)

      expect(module.get(AgentRuntime)).toBe(module.get(AgentRuntime))
      expect(module.get(AgentDefinitionRegistry)).toBe(module.get(AgentDefinitionRegistry))
      expect(agentModule.get(AgentToolRegistry)).toBe(agentModule.get(AgentToolRegistry))
      expect(module.get(AgentToolExecutor)).toBe(module.get(AgentToolExecutor))
      expect(agentModule.get(Kernel)).toBe(agentModule.get(Kernel))
    })
  })

  describe('exports', () => {
    it('exports NodeAgentLLMResolver to importing modules', async () => {
      const module = await Test.createTestingModule({
        imports: [AgentModuleConsumerModule],
      })
        .overrideProvider(NODE_CONFIGURATION)
        .useValue(configuration)
        .compile()

      const consumer = module.get(AgentModuleConsumer)

      expect(consumer.llmResolver).toBeInstanceOf(NodeAgentLLMResolver)
    })

    it('exports AgentFactory to importing modules', async () => {
      const module = await Test.createTestingModule({
        imports: [AgentModuleConsumerModule],
      })
        .overrideProvider(NODE_CONFIGURATION)
        .useValue(configuration)
        .compile()

      const consumer = module.get(AgentModuleConsumer)

      expect(consumer.agentFactory).toBeInstanceOf(AgentFactory)
    })

    it('exports AgentRuntime to importing modules', async () => {
      const module = await Test.createTestingModule({
        imports: [AgentModuleConsumerModule],
      })
        .overrideProvider(NODE_CONFIGURATION)
        .useValue(configuration)
        .compile()

      const consumer = module.get(AgentModuleConsumer)

      expect(consumer.agentRuntime).toBeInstanceOf(AgentRuntime)
    })
  })

  describe('startup failures', () => {
    it('fails module creation when NODE_CONFIGURATION is not registered', async () => {
      await expect(
        Test.createTestingModule({
          providers: [
            LLMFactoryImpl,
            {
              inject: [NODE_CONFIGURATION, LLMFactoryImpl],
              provide: NodeAgentLLMResolver,
              useFactory: (
                nodeConfiguration: NodeConfiguration,
                llmFactory: LLMFactoryImpl,
              ): NodeAgentLLMResolver => {
                return new NodeAgentLLMResolver(nodeConfiguration.llm, llmFactory)
              },
            },
          ],
        }).compile(),
      ).rejects.toThrow(/Nest can't resolve dependencies of the NodeAgentLLMResolver/)
    })
  })
})
