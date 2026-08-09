// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Value that can be stored in a {@link KeyedRegistry}.
 *
 * Registration and lookup use the stable {@link id} field as the unique key.
 */
export type KeyedRegistryEntry = {
  /**
   * Stable unique identifier used as the registry key.
   */
  readonly id: string
}

/**
 * Append-only in-memory catalog of values keyed by {@link KeyedRegistryEntry.id}.
 *
 * Shared base for definition-style registries such as
 * {@link AgentDefinitionRegistry}, {@link CapabilityRegistry}, and
 * {@link SkillRegistry}. Stores validated catalog entries only; it does not
 * load from disk, construct agents, or execute tools.
 *
 * Registration fails closed on duplicate ids. Resolve fails closed when the
 * requested id is missing. Domain registries may wrap these outcomes with
 * typed errors at their public boundary.
 *
 * Not part of the package public export surface.
 *
 * @typeParam T - Stored value type; must expose a stable {@link KeyedRegistryEntry.id}.
 */
export abstract class KeyedRegistry<T extends KeyedRegistryEntry> {
  // MARK: - Private Properties

  private readonly entries = new Map<string, T>()

  // MARK: - Computed Properties

  /**
   * Number of values currently registered.
   */
  get count(): number {
    return this.entries.size
  }

  // MARK: - Instance methods

  /**
   * Returns whether a value is registered for the given identifier.
   *
   * Prefer this for optional lookups. Use {@link resolve} when a missing entry
   * is an error for the caller.
   *
   * @param id - Stable entry identifier.
   * @returns `true` when a value is registered for `id`; otherwise `false`.
   */
  has(id: string): boolean {
    return this.entries.has(id)
  }

  /**
   * Registers a value under its {@link KeyedRegistryEntry.id}.
   *
   * Registration is append-only: an existing entry cannot be replaced. Hosts
   * should register entries during bootstrap so conflicting identifiers fail at
   * startup rather than during a live execution.
   *
   * @param value - Value to store.
   * @throws {Error} when another value is already stored under the same `id`.
   */
  register(value: T): void {
    if (this.entries.has(value.id)) {
      throw new Error(`Value with id ${value.id} already registered`)
    }

    this.entries.set(value.id, value)
  }

  /**
   * Returns the registered value for the given identifier.
   *
   * The returned value is the stored reference; callers must not mutate it.
   *
   * @param id - Stable entry identifier.
   * @returns The registered value.
   * @throws {Error} when no value is registered for `id`.
   */
  resolve(id: string): T {
    const value = this.entries.get(id)

    if (!value) {
      throw new Error(`Value with id ${id} not found`)
    }

    return value
  }

  /**
   * Returns a snapshot of all registered values in insertion order.
   *
   * The snapshot is not live-updated when later registrations occur. Useful for
   * diagnostics, startup validation, and exposing a catalog to hosts.
   *
   * @returns A new array containing the currently registered values.
   */
  values(): readonly T[] {
    return [...this.entries.values()]
  }
}
