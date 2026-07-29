// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { type Decoder, DECODER } from '@/shared/types';
import { Inject, Injectable } from '@nestjs/common';
import { readdir, readFile } from 'fs/promises';
import { SkillDefinition } from '@/definitions/models/skill-definition/skill-definition';
import { skillSchema } from '@/skills/schema/skill/skill-schema';

/**
 * Loads bundled skill definitions from the local file system.
 *
 * `SkillsLoader` scans a root directory containing one subdirectory per skill.
 * Each skill subdirectory is expected to include a `skill.toml` manifest.
 * Unlike agents, skills loaded here do not require a separate prompt file; all
 * metadata needed for the definition layer is taken from the manifest (validated
 * against {@link skillSchema}).
 *
 * Example directory structure:
 *
 * ```text
 * skills/
 * ├── financial-data/
 * │   └── skill.toml
 * └── trello/
 *     └── skill.toml
 * ```
 *
 * This class is an infrastructure boundary: it turns on-disk manifests into
 * validated {@link SkillDefinition} instances so callers do not depend on
 * TOML syntax, directory layout, or `fs` details.
 */
@Injectable()
export class SkillsLoader {
  // MARK: - Constructor

  /**
   * Creates a skill loader using the configured manifest decoder.
   *
   * @param decoder - Parses raw manifest text and runs structural validation.
   */
  constructor(
    @Inject(DECODER)
    private readonly decoder: Decoder,
  ) {}

  // MARK: - Instance methods

  /**
   * Loads every skill definition found under the given root directory.
   *
   * The path is treated as a container of skill directories. Entries that are
   * not directories are skipped. Each child directory must contain `skill.toml`
   * at its root.
   *
   * For each directory, this method:
   *
   * 1. Reads `skill.toml`.
   * 2. Decodes and validates the payload with {@link skillSchema}.
   * 3. Builds a {@link SkillDefinition} via {@link SkillDefinition.from}.
   *
   * @param rootDirectoryPath - Absolute path to the folder that holds one subdirectory per skill (for example the bundled skills root).
   * @returns All successfully loaded definitions, in directory iteration order.
   *
   * @throws {Error} When any skill directory fails to read, decode, validate, or map into a definition. The error message includes the subdirectory name; the thrown error’s `cause` option preserves the underlying failure when available.
   */
  async loadSkillsFromRootDirectory(
    rootDirectoryPath: string,
  ): Promise<SkillDefinition[]> {
    const entries = await readdir(rootDirectoryPath, { withFileTypes: true });
    const skills: SkillDefinition[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      try {
        const skillsDirectoryPath = path.join(rootDirectoryPath, entry.name);
        const manifestPath = path.join(skillsDirectoryPath, 'skill.toml');

        const raw = await readFile(manifestPath, 'utf8');
        const schema = this.decoder.decode(raw, skillSchema.parse);

        const promptPath = path.join(skillsDirectoryPath, schema.prompt_file);
        const systemPrompt = await readFile(promptPath, 'utf8');
        const skill = SkillDefinition.from(schema, systemPrompt);

        skills.push(skill);
      } catch (error) {
        throw new Error(`Failed to load skill from directory: ${entry.name}`, {
          cause: error,
        });
      }
    }

    return skills;
  }
}
