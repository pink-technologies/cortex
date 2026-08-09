// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { LLMProviderType } from '@cortex/llm'
import { AgentDefinition, AgentRole } from '../../../src/definition'

/**
 * Builds a minimal {@link AgentDefinition} for kernel tests.
 *
 * @param overrides - Optional overrides for descriptor resources, safety
 *   switches, and execution limits.
 */
export function createAgentDefinitionFixture(
  overrides: {
    readonly allowCapabilityUse?: boolean
    readonly allowSkillUse?: boolean
    readonly capabilities?: readonly string[]
    readonly maximumIterations?: number
    readonly skills?: readonly string[]
    readonly timeoutMilliseconds?: number
  } = {},
): AgentDefinition {
  return new AgentDefinition(
    'test-agent',
    {
      capabilities: overrides.capabilities ?? [],
      delegatesTo: [],
      name: 'Test Agent',
      role: AgentRole.Main,
      skills: overrides.skills ?? [],
      systemPrompt: 'You are a test agent.',
    },
    {
      maximumOutputTokens: 256,
      model: 'test-model',
      provider: LLMProviderType.OpenAI,
      temperature: 0,
    },
    {
      maximumIterations: overrides.maximumIterations ?? 5,
      timeoutMilliseconds: overrides.timeoutMilliseconds ?? 30_000,
    },
    {
      allowCapabilityUse: overrides.allowCapabilityUse ?? false,
      allowDelegation: false,
      allowSkillUse: overrides.allowSkillUse ?? false,
      maximumDelegationDepth: 0,
    },
  )
}
