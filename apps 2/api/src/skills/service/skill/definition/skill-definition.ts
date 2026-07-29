// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import z from 'zod';
import { skillSchema } from '../../../schema/skill/skill-schema';

/**
 * A registered skill: stable id.
 *
 * Implementations are stored in {@link SkillRegistry} and invoked by the kernel or orchestrator
 * after resolving which skill should act.
 */
export class SkillDefinition {
  /**
   * Stable key used in {@link SkillRegistry}.
   */
  readonly id: string;

  /**
   * Short description from bundled `skill.toml`.
   */
  readonly description?: string;

  /**
   * Input schema kind from `skill.toml` `[input].schema` (e.g. `json`).
   */
  readonly inputSchema?: string;

  /**
   * Display name from bundled `skill.toml` (see {@link SkillService}).
   */
  readonly name?: string;

  /**
   * Markdown loaded from `skill.md` next to `skill.toml` when that file
   * exists (see {@link SkillService}).
   */
  readonly promptTemplate?: string;

  // MARK: - Constructor

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
