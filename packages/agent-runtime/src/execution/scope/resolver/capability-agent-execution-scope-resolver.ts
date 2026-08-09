// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { CapabilityRegistry } from '@/capabilities'
import type { AgentDefinition } from '@/definition'
import type { SkillRegistry } from '@/skills'
import type { AgentExecutionScope } from '../../models/agent-execution-scope'
import { AgentExecutionToolNotAuthorizedError } from '../error/error'
import type { AgentExecutionScopeResolver } from '../agent-execution-scope-resolver'

/**
 * Resolves execution scopes by validating the agent manifest against the
 * runtime's capability catalog.
 *
 * Unlike {@link DefaultAgentExecutionScopeResolver}, which trusts the manifest
 * and the request as-is, this resolver limits every execution to the resources
 * its definition actually authorizes: declared capabilities must exist in the
 * {@link CapabilityRegistry}, and requested tools are exposed only when one of
 * the agent's authorized capabilities provides them.
 *
 * Resolution policy:
 * - `capabilityIds` — the descriptor's capabilities when
 *   {@link AgentSafetyDefinition.allowCapabilityUse} is enabled, otherwise
 *   empty; every id must resolve in the capability catalog
 * - `skillIds` — the descriptor's skills when
 *   {@link AgentSafetyDefinition.allowSkillUse} is enabled, otherwise empty;
 *   every id must resolve in the skill catalog when a registry is provided
 * - `toolNames` — the requested tool names, each of which must be provided by
 *   an authorized capability
 *
 * Every list is deduplicated so downstream consumers such as
 * {@link AgentToolRegistry.definitionsFor} never receive repeated identifiers.
 */
export class CapabilityAgentExecutionScopeResolver implements AgentExecutionScopeResolver {
  // MARK: - Private Properties

  private readonly capabilityRegistry: CapabilityRegistry
  private readonly skillRegistry: SkillRegistry | undefined

  // MARK: - Constructor

  /**
   * Creates a capability-validating scope resolver.
   *
   * @param capabilityRegistry - Catalog used to resolve the agent's declared
   * capabilities and the tool names they provide.
   * @param skillRegistry - Optional catalog used to validate declared skills.
   */
  constructor(capabilityRegistry: CapabilityRegistry, skillRegistry?: SkillRegistry) {
    this.capabilityRegistry = capabilityRegistry
    this.skillRegistry = skillRegistry
  }

  // MARK: - AgentExecutionScopeResolver

  /**
   * Resolves the execution scope for one run of the specified agent.
   *
   * @param definition - Static configuration of the agent being executed.
   * @param requestedToolNames - Tool names requested for this run.
   * @returns The deduplicated allowlist of resources authorized for the execution.
   * @throws {@link CapabilityNotFoundError} When a declared capability is not
   *   registered in the capability catalog.
   * @throws {@link AgentExecutionToolNotAuthorizedError} When a requested tool
   *   is not provided by any authorized capability.
   */
  async resolve(definition: AgentDefinition, requestedToolNames: readonly string[]): Promise<AgentExecutionScope> {
    const capabilityIds = definition.safety.allowCapabilityUse ? [...new Set(definition.descriptor.capabilities)] : []
    const skillIds = definition.safety.allowSkillUse ? [...new Set(definition.descriptor.skills)] : []

    if (this.skillRegistry) {
      for (const skillId of skillIds) {
        this.skillRegistry.resolve(skillId)
      }
    }

    const authorizedToolNames = this.collectAuthorizedToolNames(capabilityIds)

    return {
      capabilityIds,
      skillIds,
      toolNames: this.resolveRequestedToolNames(requestedToolNames, authorizedToolNames),
    }
  }

  // MARK: - Private methods

  private collectAuthorizedToolNames(capabilityIds: readonly string[]): ReadonlySet<string> {
    const toolNames = new Set<string>()

    for (const capabilityId of capabilityIds) {
      const capability = this.capabilityRegistry.resolve(capabilityId)

      for (const toolName of capability.toolNames) {
        toolNames.add(toolName)
      }
    }

    return toolNames
  }

  private resolveRequestedToolNames(
    requestedToolNames: readonly string[],
    authorizedToolNames: ReadonlySet<string>,
  ): readonly string[] {
    const toolNames = [...new Set(requestedToolNames)]

    for (const toolName of toolNames) {
      if (!authorizedToolNames.has(toolName)) {
        throw new AgentExecutionToolNotAuthorizedError(toolName)
      }
    }

    return toolNames
  }
}
