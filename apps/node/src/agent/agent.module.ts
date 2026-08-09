// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { LLMFactoryImpl } from '@cortex/llm'
import { Module } from '@nestjs/common'
import { AgentRuntimeBootstrap } from './bootstrap'
import { AgentProcessResolver } from './agent-process-resolver'
import { NODE_CONFIGURATION, NodeConfiguration } from '../configuration'
import { NodeConfigurationModule } from '../configuration/node-configuration.module'
import { NodeAgentLLMResolver } from './provider'
import {
  AgentFactory,
  AgentDefinitionRegistry,
  AgentRuntime,
  AgentToolExecutor,
  AgentToolRegistry,
  CapabilityAgentExecutionScopeResolver,
  CapabilityDefinitionLoader,
  CapabilityRegistry,
  Kernel,
  DECODER,
  AgentDefinitionLoader,
  Decoder,
  SkillDefinitionLoader,
  SkillRegistry,
  TomlDecoder,
} from '@cortex/agent-runtime'

@Module({
  imports: [NodeConfigurationModule],
  exports: [
    AgentDefinitionRegistry,
    AgentFactory,
    AgentProcessResolver,
    AgentRuntime,
    AgentRuntimeBootstrap,
    AgentToolExecutor,
    CapabilityRegistry,
    NodeAgentLLMResolver,
    SkillRegistry,
  ],
  providers: [
    LLMFactoryImpl,
    {
      provide: DECODER,
      useClass: TomlDecoder,
    },
    {
      inject: [DECODER],
      provide: AgentDefinitionLoader,
      useFactory: (decoder: Decoder): AgentDefinitionLoader => {
        return new AgentDefinitionLoader(decoder)
      },
    },
    {
      inject: [DECODER],
      provide: CapabilityDefinitionLoader,
      useFactory: (decoder: Decoder): CapabilityDefinitionLoader => {
        return new CapabilityDefinitionLoader(decoder)
      },
    },
    {
      inject: [DECODER],
      provide: SkillDefinitionLoader,
      useFactory: (decoder: Decoder): SkillDefinitionLoader => {
        return new SkillDefinitionLoader(decoder)
      },
    },
    {
      inject: [NODE_CONFIGURATION, LLMFactoryImpl],
      provide: NodeAgentLLMResolver,
      useFactory: (configuration: NodeConfiguration, llmFactory: LLMFactoryImpl): NodeAgentLLMResolver => {
        return new NodeAgentLLMResolver(configuration.llm, llmFactory)
      },
    },
    {
      inject: [NodeAgentLLMResolver],
      provide: AgentFactory,
      useFactory: (llmResolver: NodeAgentLLMResolver): AgentFactory => {
        return new AgentFactory(llmResolver)
      },
    },
    {
      provide: AgentDefinitionRegistry,
      useFactory: (): AgentDefinitionRegistry => {
        return new AgentDefinitionRegistry()
      },
    },
    {
      provide: AgentToolRegistry,
      useFactory: (): AgentToolRegistry => {
        return new AgentToolRegistry()
      },
    },
    {
      inject: [AgentToolRegistry],
      provide: AgentToolExecutor,
      useFactory: (toolRegistry: AgentToolRegistry): AgentToolExecutor => {
        return new AgentToolExecutor(toolRegistry)
      },
    },
    {
      inject: [AgentToolExecutor],
      provide: Kernel,
      useFactory: (toolExecutor: AgentToolExecutor): Kernel => {
        return new Kernel(toolExecutor)
      },
    },
    {
      provide: CapabilityRegistry,
      useFactory: (): CapabilityRegistry => {
        return new CapabilityRegistry()
      },
    },
    {
      provide: SkillRegistry,
      useFactory: (): SkillRegistry => {
        return new SkillRegistry()
      },
    },
    {
      inject: [CapabilityRegistry, SkillRegistry],
      provide: CapabilityAgentExecutionScopeResolver,
      useFactory: (
        capabilityRegistry: CapabilityRegistry,
        skillRegistry: SkillRegistry,
      ): CapabilityAgentExecutionScopeResolver => {
        return new CapabilityAgentExecutionScopeResolver(capabilityRegistry, skillRegistry)
      },
    },
    {
      inject: [
        AgentFactory,
        AgentDefinitionRegistry,
        CapabilityAgentExecutionScopeResolver,
        Kernel,
        AgentToolRegistry,
      ],
      provide: AgentRuntime,
      useFactory: (
        agentFactory: AgentFactory,
        definitionRegistry: AgentDefinitionRegistry,
        executionScopeResolver: CapabilityAgentExecutionScopeResolver,
        kernel: Kernel,
        toolRegistry: AgentToolRegistry,
      ): AgentRuntime => {
        return new AgentRuntime(
          agentFactory,
          definitionRegistry,
          executionScopeResolver,
          kernel,
          toolRegistry,
        )
      },
    },
    {
      inject: [AgentDefinitionRegistry, CapabilityRegistry],
      provide: AgentProcessResolver,
      useFactory: (
        agentDefinitionRegistry: AgentDefinitionRegistry,
        capabilityRegistry: CapabilityRegistry,
      ): AgentProcessResolver => {
        return new AgentProcessResolver(agentDefinitionRegistry, capabilityRegistry)
      },
    },
    {
      inject: [
        AgentDefinitionLoader,
        AgentDefinitionRegistry,
        CapabilityDefinitionLoader,
        CapabilityRegistry,
        SkillDefinitionLoader,
        SkillRegistry,
      ],
      provide: AgentRuntimeBootstrap,
      useFactory: (
        agentDefinitionLoader: AgentDefinitionLoader,
        agentDefinitionRegistry: AgentDefinitionRegistry,
        capabilityDefinitionLoader: CapabilityDefinitionLoader,
        capabilityRegistry: CapabilityRegistry,
        skillDefinitionLoader: SkillDefinitionLoader,
        skillRegistry: SkillRegistry,
      ): AgentRuntimeBootstrap => {
        return new AgentRuntimeBootstrap(
          resolveAgentsCatalogDirectory('agents'),
          resolveAgentsCatalogDirectory('capabilities'),
          resolveAgentsCatalogDirectory('skills'),
          agentDefinitionLoader,
          agentDefinitionRegistry,
          capabilityDefinitionLoader,
          capabilityRegistry,
          skillDefinitionLoader,
          skillRegistry,
        )
      },
    },
  ],
})
export class AgentModule {}

/**
 * Resolves a directory under the monorepo-root `.agents/` catalog.
 *
 * Walks from `process.cwd()` upward until `.agents/<name>` is found so the
 * Node can boot from the repo root or from `apps/node`.
 */
function resolveAgentsCatalogDirectory(
  name: 'agents' | 'capabilities' | 'skills',
): string {
  let directory = process.cwd()

  for (;;) {
    const candidate = join(directory, '.agents', name)
    if (existsSync(candidate)) {
      return candidate
    }

    const parent = join(directory, '..')
    if (parent === directory) {
      break
    }
    directory = parent
  }

  return join(process.cwd(), '.agents', name)
}
