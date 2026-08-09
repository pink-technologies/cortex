// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import {
  AgentDefinitionRegistry,
  CapabilityRegistry,
  type AgentDefinition,
} from '@cortex/agent-runtime'
import { JiraTriageJobKind, RepositoryReviewJobKind } from '@cortex/protocol'

/**
 * Fallback kind → agent id when a capability omits `default_agent`.
 */
const DEFAULT_AGENT_BY_KIND: Readonly<Record<string, string>> = {
  [JiraTriageJobKind]: 'qa',
  [RepositoryReviewJobKind]: 'coder',
}

/**
 * Resolves the default agent package that owns an execution-job kind.
 *
 * Prefers {@link CapabilityDefinition.defaultAgentId} when the capability id
 * matches the job kind; otherwise uses a small Node-side fallback map.
 */
@Injectable()
export class AgentProcessResolver {
  // MARK: - Constructor

  /**
   * Creates a resolver for default agents that own execution-job kinds.
   *
   * @param agentDefinitionRegistry - Registry of loaded agent packages.
   * @param capabilityRegistry - Registry of loaded capability definitions.
   */
  constructor(
    private readonly agentDefinitionRegistry: AgentDefinitionRegistry,
    private readonly capabilityRegistry: CapabilityRegistry,
  ) {}

  /**
   * Returns the default agent id for a job kind.
   *
   * @param kind - Execution job kind (for example `repository.review`).
   * @returns Stable agent package id.
   */
  resolveDefaultAgentId(kind: string): string {
    if (this.capabilityRegistry.has(kind)) {
      const capability = this.capabilityRegistry.resolve(kind)

      if (capability.defaultAgentId) {
        return capability.defaultAgentId
      }
    }

    const fallback = DEFAULT_AGENT_BY_KIND[kind]

    if (!fallback) {
      throw new Error(`No default agent is configured for execution job kind '${kind}'.`)
    }

    return fallback
  }

  /**
   * Resolves the agent definition that owns a job kind.
   *
   * @param kind - Execution job kind.
   * @returns Registered {@link AgentDefinition}.
   */
  resolveAgent(kind: string): AgentDefinition {
    return this.agentDefinitionRegistry.resolve(this.resolveDefaultAgentId(kind))
  }

  /**
   * Resolves a registered agent by its package id.
   *
   * Use this when a workflow step needs a specific agent role (for example the
   * `coder` agent for Jira autofix) rather than the default owner of a job kind.
   *
   * @param agentId - Stable agent package id.
   * @returns Registered {@link AgentDefinition}.
   */
  resolveAgentById(agentId: string): AgentDefinition {
    return this.agentDefinitionRegistry.resolve(agentId)
  }
}
