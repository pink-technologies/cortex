// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import z from 'zod';
import { skillSchema } from '@/definitions/schema/skill/skill-schema';

/**
 * Static configuration for a skill loaded from bundled manifests (`skill.toml`) and
 * optional companion prompt content.
 *
 * `SkillDefinition` holds the stable id, display metadata, declared input schema kind,
 * and resolved prompt template used when the skill participates in orchestration or
 * agent tool selection. It mirrors the runtime-facing skill definition shape used
 * after registration in the skills module.
 *
 * A definition instance is not itself invocable; execution wiring (registry, context,
 * validators) is provided by the skills runtime.
 */
export class SkillDefinition {
  /**
   * Stable skill identifier used for registry storage and agent manifest references.
   */
  readonly id: string;

  /**
   * Short summary from the manifest for routing, documentation, or operator UX.
   */
  readonly description: string;

  /**
   * Input schema kind from the manifest `[input].schema` (for example `json`).
   */
  readonly inputSchema?: string;

  /**
   * Human-readable display name from `skill.toml`.
   */
  readonly name: string;

  /**
   * Prompt body loaded from `skill.md` (or equivalent) alongside the manifest,
   * interpolated or sent as instructions when the skill runs.
   */
  readonly promptTemplate: string;

  // MARK: - Constructor

  /**
   * Builds a skill definition from validated manifest fields and a resolved template.
   *
   * @param options - Identity, labels, input schema kind, and prompt template sourced from decode + file load.
   */
  constructor(options: {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly inputSchema: string;
    readonly promptTemplate: string;
  }) {
    this.id = options.id;
    this.description = options.description;
    this.inputSchema = options.inputSchema;
    this.name = options.name;
    this.promptTemplate = options.promptTemplate;
  }

  // MARK: - Static methods

  /**
   * Constructs a skill definition from a parsed `skill.toml` payload and the loaded
   * prompt template text.
   *
   * @param schema - Validated skill manifest (see {@link skillSchema}).
   * @param promptTemplate - Markdown or plain text read from the skill’s prompt file.
   * @returns A definition instance suitable for catalog registration.
   */
  static from(
    schema: z.infer<typeof skillSchema>,
    promptTemplate: string,
  ): SkillDefinition {
    return new SkillDefinition({
      id: schema.id,
      description: schema.description,
      inputSchema: schema.input.schema,
      name: schema.name,
      promptTemplate: promptTemplate,
    });
  }
}
