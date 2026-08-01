// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { CapabilityDefinition } from '../models/capability-definition'
import { CapabilityAlreadyRegisteredError, CapabilityNotFoundError } from '../error/error'

/**
 * In-memory catalog of {@link CapabilityDefinition} records available to the
 * runtime.
 *
 * The registry tells Cortex what each capability provides. It is populated
 * during host bootstrap and consulted by scope resolution to translate an
 * agent's declared capability ids into the tool names those capabilities
 * contribute to an execution.
 *
 * Responsibilities:
 * - store capability metadata keyed by stable identifier
 * - reject duplicate registration so conflicting catalogs fail closed
 * - resolve definitions by id without executing tools or contacting providers
 *
 * Non-responsibilities:
 * - deciding whether an agent may use a capability (scope resolution)
 * - registering or executing the underlying tools (tool registry / executor)
 *
 * The registry holds metadata only. It does not cache credentials,
 * conversation state, or per-run execution context.
 */
export class CapabilityRegistry {
  // MARK: - Private Properties

  /**
   * Definitions keyed by {@link CapabilityDefinition.id}.
   *
   * Insertion order is preserved so {@link values} returns registration order.
   */
  private readonly definitions = new Map<string, CapabilityDefinition>()

  // MARK: - Computed Properties

  /**
   * Number of capability definitions currently registered.
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
   * @param id - Stable capability identifier (`CapabilityDefinition.id`).
   * @returns `true` when a definition is registered for `id`; otherwise
   *   `false`.
   */
  has(id: string): boolean {
    return this.definitions.has(id)
  }

  /**
   * Registers a capability definition under its {@link CapabilityDefinition.id}.
   *
   * Registration is append-only: an existing entry cannot be replaced. Hosts
   * should register definitions during bootstrap so duplicate identifiers from
   * conflicting catalogs fail at startup rather than during a live execution.
   *
   * @param definition - Capability definition to store.
   * @throws {@link CapabilityAlreadyRegisteredError} when another definition
   *   is already stored under the same identifier.
   */
  register(definition: CapabilityDefinition): void {
    if (this.definitions.has(definition.id)) {
      throw new CapabilityAlreadyRegisteredError(definition.id)
    }

    this.definitions.set(definition.id, definition)
  }

  /**
   * Returns the registered definition for the given identifier.
   *
   * Used during scope resolution to translate an agent's declared capability
   * ids into contributed tool names. The returned value is the stored
   * definition reference; callers must not mutate it.
   *
   * @param id - Stable capability identifier (`CapabilityDefinition.id`).
   * @returns The registered {@link CapabilityDefinition}.
   * @throws {@link CapabilityNotFoundError} when no definition is registered
   *   for `id`.
   */
  resolve(id: string): CapabilityDefinition {
    const definition = this.definitions.get(id)

    if (!definition) {
      throw new CapabilityNotFoundError(id)
    }

    return definition
  }

  /**
   * Returns a snapshot of all registered capability definitions.
   *
   * The snapshot reflects registration order (Map insertion order) and is not
   * live-updated when later registrations occur. Useful for diagnostics and
   * exposing the capability catalog to hosts.
   *
   * @returns A new array containing the currently registered definitions.
   */
  values(): readonly CapabilityDefinition[] {
    return [...this.definitions.values()]
  }
}
