// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  AgentDefinitionRegistry,
  CapabilityRegistry,
  type AgentDefinition,
  type CapabilityDefinition,
} from '@cortex/agent-runtime'
import { JiraTriageJobKind, RepositoryReviewJobKind } from '@cortex/protocol'
import { AgentProcessResolver } from '../../src/agent/agent-process-resolver'

describe('AgentProcessResolver', () => {
  it('resolves the default agent from capability.defaultAgentId', () => {
    const agentRegistry = new AgentDefinitionRegistry()
    const capabilityRegistry = new CapabilityRegistry()

    const agent = {
      id: 'coder',
    } as AgentDefinition

    agentRegistry.register(agent)
    capabilityRegistry.register({
      defaultAgentId: 'coder',
      description: 'Review',
      id: RepositoryReviewJobKind,
      toolNames: [],
    } satisfies CapabilityDefinition)

    const resolver = new AgentProcessResolver(agentRegistry, capabilityRegistry)

    expect(resolver.resolveDefaultAgentId(RepositoryReviewJobKind)).toBe('coder')
    expect(resolver.resolveAgent(RepositoryReviewJobKind)).toBe(agent)
  })

  it('falls back to the kind map when capability omits defaultAgentId', () => {
    const agentRegistry = new AgentDefinitionRegistry()
    const capabilityRegistry = new CapabilityRegistry()

    agentRegistry.register({ id: 'coder' } as AgentDefinition)
    capabilityRegistry.register({
      description: 'Review',
      id: RepositoryReviewJobKind,
      toolNames: [],
    })

    const resolver = new AgentProcessResolver(agentRegistry, capabilityRegistry)

    expect(resolver.resolveDefaultAgentId(RepositoryReviewJobKind)).toBe('coder')
  })

  it('falls back to qa for jira.triage', () => {
    const agentRegistry = new AgentDefinitionRegistry()
    const capabilityRegistry = new CapabilityRegistry()

    agentRegistry.register({ id: 'qa' } as AgentDefinition)
    capabilityRegistry.register({
      description: 'Triage',
      id: JiraTriageJobKind,
      toolNames: [],
    })

    const resolver = new AgentProcessResolver(agentRegistry, capabilityRegistry)

    expect(resolver.resolveDefaultAgentId(JiraTriageJobKind)).toBe('qa')
  })

  it('throws when no default agent exists for the kind', () => {
    const resolver = new AgentProcessResolver(
      new AgentDefinitionRegistry(),
      new CapabilityRegistry(),
    )

    expect(() => resolver.resolveDefaultAgentId('unknown.kind')).toThrow(
      /No default agent is configured/,
    )
  })

  it('resolves an agent by package id', () => {
    const agentRegistry = new AgentDefinitionRegistry()
    const coder = { id: 'coder' } as AgentDefinition
    agentRegistry.register(coder)

    const resolver = new AgentProcessResolver(agentRegistry, new CapabilityRegistry())

    expect(resolver.resolveAgentById('coder')).toBe(coder)
  })
})
