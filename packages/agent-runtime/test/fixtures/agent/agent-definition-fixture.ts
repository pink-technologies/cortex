// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { LLMProviderType } from '@cortex/llm'
import { AgentDefinition, AgentRole } from '../../../src/definition'

/**
 * Builds a minimal {@link AgentDefinition} for kernel tests.
 *
 * @param overrides - Optional overrides for execution limits.
 */
export function createAgentDefinitionFixture(
  overrides: {
    readonly maximumIterations?: number
    readonly timeoutMilliseconds?: number
  } = {},
): AgentDefinition {
  return new AgentDefinition(
    'test-agent',
    {
      capabilities: [],
      delegatesTo: [],
      name: 'Test Agent',
      role: AgentRole.Main,
      skills: [],
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
      allowCapabilityUse: false,
      allowDelegation: false,
      allowSkillUse: false,
      maximumDelegationDepth: 0,
    },
  )
}
