// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentDefinition } from '@/definition'
import type { AgentExecutionScope } from './agent-execution-scope'
import type { AgentExecutionScopeResolver } from './agent-execution-scope-resolver'

/**
 * Resolves execution scopes from the agent manifest and its safety settings.
 *
 * This is the runtime's standard {@link AgentExecutionScopeResolver}. It
 * derives each resource class directly from the {@link AgentDefinition}:
 * capabilities and skills come from the descriptor, gated by the matching
 * safety switch; tools come from the run's requested names, since the
 * manifest declares no tool allowlist of its own.
 *
 * Resolution policy:
 * - `capabilityIds` — the descriptor's capabilities when
 *   {@link AgentSafetyDefinition.allowCapabilityUse} is enabled, otherwise empty
 * - `skillIds` — the descriptor's skills when
 *   {@link AgentSafetyDefinition.allowSkillUse} is enabled, otherwise empty
 * - `toolNames` — the requested tool names
 *
 * Every list is deduplicated so downstream consumers such as
 * {@link AgentToolRegistry.definitionsFor} never receive repeated
 * identifiers. This resolver performs no catalog validation — it never
 * consults runtime registries or performs I/O. Hosts that need availability
 * checks or stricter policy can replace it with their own implementation.
 */
export class DefaultAgentExecutionScopeResolver implements AgentExecutionScopeResolver {
  // MARK: - AgentExecutionScopeResolver

  /**
   * Resolves the execution scope for one run of the specified agent.
   *
   * @param definition - Static configuration of the agent being executed.
   * @param requestedToolNames - Tool names requested for this run.
   * @returns The deduplicated allowlist of resources authorized for the execution.
   */
  async resolve(definition: AgentDefinition, requestedToolNames: readonly string[]): Promise<AgentExecutionScope> {
    return {
      capabilityIds: definition.safety.allowCapabilityUse
        ? [...new Set(definition.descriptor.capabilities)]
        : [],
      skillIds: definition.safety.allowSkillUse
        ? [...new Set(definition.descriptor.skills)]
        : [],
      toolNames: [...new Set(requestedToolNames)],
    }
  }
}
