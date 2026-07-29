// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { capabilitySchema } from '@/definitions/schema/capability/capability.schema';
import z from 'zod';

/**
 * Declarative metadata for a capability loaded from a bundled manifest (for example `capability.toml`).
 *
 * `CapabilityDefinition` is the definition-layer view: stable identity plus optional
 * presentation and tool wiring. It aligns with the subset of fields persisted when
 * registering bundled capabilities and mirrors the runtime-facing {@link Capability} shape
 * for catalog and discovery.
 *
 * It is not an executable capability; executors and organization-scoped configuration
 * are resolved separately when the runtime invokes a capability.
 */
export class CapabilityDefinition {
  /**
   * Stable capability identifier used for registry storage and agent manifest references.
   */
  readonly id: string;

  /**
   * Short description for routing, documentation, or operator UX.
   */
  readonly description: string;

  /**
   * Human-readable name from the manifest.
   */
  readonly name: string;

  /**
   * Tool identifiers this capability declares or may route execution to.
   */
  readonly tools: readonly string[];

  // MARK: - Constructor

  /**
   * Builds a capability definition from validated manifest fields.
   *
   * @param options - Stable id, display name, description, and declared tool ids from decode + validation.
   */
  constructor(options: {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly tools: string[];
  }) {
    this.id = options.id;
    this.name = options.name;
    this.description = options.description;
    this.tools = options.tools;
  }

  // MARK: - Static methods

  /**
   * Constructs a {@link CapabilityDefinition} from a parsed and validated `capability.toml` payload.
   *
   * @param schema - Output of {@link capabilitySchema.parse} (or equivalent) on the manifest.
   * @returns A definition instance suitable for catalog registration or storage.
   */
  static from(schema: z.infer<typeof capabilitySchema>): CapabilityDefinition {
    return new CapabilityDefinition({
      id: schema.id,
      name: schema.name,
      description: schema.description,
      tools: schema.tools,
    });
  }
}
