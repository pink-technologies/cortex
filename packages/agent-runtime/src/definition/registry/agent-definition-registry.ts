// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentDefinitionAlreadyRegisteredError, AgentDefinitionNotFoundError } from '@/definition/error/error'
import type { AgentDefinition } from '@/definition/models'

/**
 * In-memory catalog of {@link AgentDefinition} records available to the runtime.
 *
 * The registry is the lookup boundary between static agent configuration and
 * executable agents. Definitions are indexed by {@link AgentDefinition.id} and
 * are typically populated once at startup from
 * {@link AgentDefinitionLoader.loadAgentsFromRootDirectory} (or an equivalent
 * host bootstrap). {@link AgentRuntime.execute} resolves
 * {@link AgentRuntimeRequest.agentId} through this registry, then asks
 * {@link AgentFactory} to build a fresh executable agent for that run.
 *
 * Responsibilities:
 * - store validated definitions keyed by stable identifier
 * - reject duplicate registration so conflicting manifests fail closed
 * - resolve definitions by id without creating agents or contacting providers
 *
 * Non-responsibilities:
 * - loading manifests from disk (see {@link AgentDefinitionLoader})
 * - constructing {@link Agent} instances (see {@link AgentFactory})
 * - enforcing tool allowlists or driving the multi-turn loop (see
 *   {@link AgentToolRegistry} and {@link Kernel})
 *
 * The registry holds configuration only. It does not cache executable agents,
 * credentials, conversation state, or per-run execution context.
 */
export class AgentDefinitionRegistry {
  // MARK: - Private Properties

  /**
   * Definitions keyed by {@link AgentDefinition.id}.
   *
   * Insertion order is preserved so {@link values} returns registration order.
   */
  private readonly definitions = new Map<string, AgentDefinition>()

  // MARK: - Computed Properties

  /**
   * Number of agent definitions currently registered.
   */
  get count(): number {
    return this.definitions.size
  }

  // MARK: - Instance Methods

  /**
   * Returns whether a definition is registered for the given identifier.
   *
   * Prefer this for optional lookups. Use {@link resolve} when a missing
   * definition is an error for the caller.
   *
   * @param id - Stable agent identifier (`AgentDefinition.id`).
   * @returns `true` when a definition is registered for `id`; otherwise
   *   `false`.
   */
  has(id: string): boolean {
    return this.definitions.has(id)
  }

  /**
   * Registers an agent definition under its {@link AgentDefinition.id}.
   *
   * Registration is append-only: an existing entry cannot be replaced. Hosts
   * should register definitions during bootstrap so duplicate identifiers from
   * conflicting manifests fail at startup rather than during a live execution.
   *
   * @param definition - Validated agent definition to store.
   * @throws {@link AgentDefinitionAlreadyRegisteredError} when another
   *   definition is already stored under the same identifier.
   */
  register(definition: AgentDefinition): void {
    if (this.definitions.has(definition.id)) {
      throw new AgentDefinitionAlreadyRegisteredError(definition.id)
    }

    this.definitions.set(definition.id, definition)
  }

  /**
   * Returns the registered definition for the given identifier.
   *
   * Used by {@link AgentRuntime} when preparing an execution from
   * {@link AgentRuntimeRequest.agentId}. The returned value is the stored
   * definition reference; callers must not mutate it.
   *
   * @param id - Stable agent identifier (`AgentDefinition.id`).
   * @returns The registered {@link AgentDefinition}.
   * @throws {@link AgentDefinitionNotFoundError} when no definition is
   *   registered for `id`.
   */
  resolve(id: string): AgentDefinition {
    const definition = this.definitions.get(id)

    if (!definition) {
      throw new AgentDefinitionNotFoundError(id)
    }

    return definition
  }

  /**
   * Returns a snapshot of all registered agent definitions.
   *
   * The snapshot reflects registration order (Map insertion order) and is not
   * live-updated when later registrations occur. Useful for diagnostics,
   * startup validation, and exposing the agent catalog to hosts.
   *
   * @returns A new array containing the currently registered definitions.
   */
  values(): readonly AgentDefinition[] {
    return [...this.definitions.values()]
  }
}
