// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { type Decoder, DECODER } from '@/shared/types';
import { Inject, Injectable } from '@nestjs/common';
import { readdir, readFile } from 'fs/promises';
import { skillSchema } from '../../../schema/skill/skill-schema';
import { SkillDefinition } from '../definition/skill-definition';
import { SkillLoadError } from '../error/error';

/**
 * Loads bundled skill definitions from the local file system.
 *
 * `SkillLoader` scans a root directory containing one subdirectory per skill.
 * Each skill subdirectory is expected to include a `skill.toml` manifest and
 * a `skill.md` prompt template.
 *
 * Example directory structure:
 *
 * ```text
 * skills/
 * ├── text-rewrite/
 * │   ├── skill.toml
 * │   └── skill.md
 * └── financial-explain/
 *     ├── skill.toml
 *     └── skill.md
 * ```
 *
 * This class acts as an infrastructure boundary. It converts file-based skill
 * definitions into validated `SkillDefinition` domain models so the rest of the
 * runtime does not depend on TOML parsing, directory traversal, or file-system
 * details.
 */
@Injectable()
export class SkillLoader {
  // MARK: - Constructor

  /**
   * Creates a skill loader using the configured manifest decoder.
   *
   * @param decoder - The decoder used to parse and validate skill manifests.
   */
  constructor(
    @Inject(DECODER)
    private readonly decoder: Decoder,
  ) {}

  // MARK: - Instance methods

  /**
   * Loads all skill definitions found under the given root directory.
   *
   * The provided directory is treated as a container of skill directories. Files
   * directly inside this directory are ignored. Each child directory is treated
   * as one skill definition and must contain a `skill.toml` manifest file and a
   * `skill.md` prompt template file.
   *
   * For each valid skill directory, this method:
   *
   * 1. Reads the `skill.toml` manifest.
   * 2. Decodes and validates the manifest using `skillSchema`.
   * 3. Reads the `skill.md` prompt template.
   * 4. Creates a `SkillDefinition` domain model from the manifest and prompt.
   *
   * @param rootDirectoryPath - The path to the directory containing bundled skill directories.
   * @returns A promise that resolves to the loaded skill definitions.
   *
   * @throws SkillLoadError If a skill directory cannot be loaded, decoded,
   * or converted into a `SkillDefinition`.
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
        const manifestPath = path.join(skillsDirectoryPath, 'agent.toml');

        const raw = await readFile(manifestPath, 'utf8');
        const schema = this.decoder.decode(raw, skillSchema.parse);

        const promptPath = await readFile(
          path.join(skillsDirectoryPath, 'skill.md'),
          'utf8',
        );
        const promptTemplate = await readFile(promptPath, 'utf8');

        const agent = SkillDefinition.from(schema, promptTemplate);

        skills.push(agent);
      } catch (error) {
        throw new SkillLoadError(
          `Failed to load skill from directory: ${entry.name}`,
          { cause: error },
        );
      }
    }

    return skills;
  }
}
