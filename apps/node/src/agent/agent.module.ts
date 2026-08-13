// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { bundledAgentCatalog } from '@cortex/agent-catalog'
import { LLMFactoryImpl } from '@cortex/llm'
import { Module } from '@nestjs/common'
import { NODE_CONFIGURATION, type NodeConfiguration } from '../configuration'
import { NodeConfigurationModule } from '../configuration/node-configuration.module'
import { AgentProcessResolver } from './agent-process-resolver'
import { AgentRuntimeBootstrap } from './bootstrap'
import { NodeAgentLLMResolver } from './provider'
import {
  AgentDefinitionLoader,
  AgentDefinitionRegistry,
  AgentFactory,
  AgentRuntime,
  AgentToolAvailabilityResolver,
  AgentToolExecutor,
  AgentToolPermissionAuthorizationPolicy,
  AgentToolRegistry,
  AgentToolResultContentMapper,
  CapabilityDefinitionLoader,
  CapabilityRegistry,
  DECODER,
  type Decoder,
  Kernel,
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
      provide: AgentToolPermissionAuthorizationPolicy,
      useFactory: (): AgentToolPermissionAuthorizationPolicy => {
        return new AgentToolPermissionAuthorizationPolicy()
      },
    },
    {
      inject: [AgentToolRegistry, AgentToolPermissionAuthorizationPolicy],
      provide: AgentToolAvailabilityResolver,
      useFactory: (
        toolRegistry: AgentToolRegistry,
        authorizationPolicy: AgentToolPermissionAuthorizationPolicy,
      ): AgentToolAvailabilityResolver => {
        return new AgentToolAvailabilityResolver(toolRegistry, authorizationPolicy)
      },
    },
    {
      inject: [AgentToolRegistry, AgentToolPermissionAuthorizationPolicy],
      provide: AgentToolExecutor,
      useFactory: (
        toolRegistry: AgentToolRegistry,
        authorizationPolicy: AgentToolPermissionAuthorizationPolicy,
      ): AgentToolExecutor => {
        return new AgentToolExecutor(toolRegistry, authorizationPolicy)
      },
    },
    {
      provide: AgentToolResultContentMapper,
      useFactory: (): AgentToolResultContentMapper => {
        return new AgentToolResultContentMapper()
      },
    },
    {
      inject: [AgentToolExecutor, AgentToolResultContentMapper],
      provide: Kernel,
      useFactory: (toolExecutor: AgentToolExecutor, toolResultContentMapper: AgentToolResultContentMapper): Kernel => {
        return new Kernel(toolExecutor, toolResultContentMapper)
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
      inject: [AgentFactory, AgentDefinitionRegistry, Kernel, AgentToolAvailabilityResolver],
      provide: AgentRuntime,
      useFactory: (
        agentFactory: AgentFactory,
        definitionRegistry: AgentDefinitionRegistry,
        kernel: Kernel,
        toolResolver: AgentToolAvailabilityResolver,
      ): AgentRuntime => {
        return new AgentRuntime(agentFactory, definitionRegistry, kernel, toolResolver)
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
          bundledAgentCatalog.agentsDirectory,
          bundledAgentCatalog.capabilitiesDirectory,
          bundledAgentCatalog.skillsDirectory,
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