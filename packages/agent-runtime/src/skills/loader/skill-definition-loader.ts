// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path'
import { readdir, readFile } from 'fs/promises'
import type { Decoder } from '@/manifest/decoder/decoder'
import type { SkillDefinition } from '../models/skill-definition'
import { skillSchema } from '../schema/skill-schema'

/**
 * Loads bundled skill definitions from the local file system.
 *
 * Scans a root directory containing one subdirectory per skill. Each
 * subdirectory must include a `skill.toml` manifest and the referenced
 * prompt file. Shared skills typically live under `.agents/skills/`.
 * Capability-local skills under `capabilities/<id>/skills/` are loaded via
 * {@link loadFromDomainPackages}.
 */
export class SkillDefinitionLoader {
  // MARK: - Constructor

  /**
   * Creates a skill loader using the configured manifest decoder.
   *
   * @param decoder - The decoder used to parse and validate skill manifests.
   */
  constructor(private readonly decoder: Decoder) {}

  /**
   * Loads all skill definitions found under the given root directory.
   *
   * When the root directory does not exist, returns an empty list so Nodes
   * without skill packages can still boot.
   *
   * @param rootDirectoryPath - Path to the directory containing skill packages.
   * @returns The loaded skill definitions.
   */
  async loadFromRootDirectory(rootDirectoryPath: string): Promise<SkillDefinition[]> {
    let entries

    try {
      entries = await readdir(rootDirectoryPath, { withFileTypes: true })
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'ENOENT'
      ) {
        return []
      }

      throw error
    }

    const definitions: SkillDefinition[] = []

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }

      try {
        const skillDirectoryPath = path.join(rootDirectoryPath, entry.name)
        const manifestPath = path.join(skillDirectoryPath, 'skill.toml')
        const raw = await readFile(manifestPath, 'utf8')
        const schema = this.decoder.decode(raw, skillSchema.parse)
        const promptPath = path.join(skillDirectoryPath, schema.prompt_file)
        const prompt = (await readFile(promptPath, 'utf8')).trim()

        if (prompt.length === 0) {
          throw new Error(`Skill prompt file '${schema.prompt_file}' is empty.`)
        }

        definitions.push({
          description: schema.description,
          id: schema.id,
          ...(schema.keywords.length > 0 ? { keywords: schema.keywords } : {}),
          prompt,
        })
      } catch (error) {
        throw new Error(`Failed to load skill from directory: ${entry.name}`, {
          cause: error,
        })
      }
    }

    return definitions
  }

  /**
   * Loads skills nested under capability packages (`capabilities/id/skills/`).
   *
   * Each child of `capabilitiesRoot` is treated as a capability directory.
   * When a skills subdirectory exists, its child packages are loaded with
   * {@link loadFromRootDirectory}. Missing capability roots yield an empty list.
   *
   * @param capabilitiesRootPath - Path to the capabilities catalog root.
   * @returns Skill definitions found under capability packages.
   */
  async loadFromDomainPackages(capabilitiesRootPath: string): Promise<SkillDefinition[]> {
    let capabilityEntries

    try {
      capabilityEntries = await readdir(capabilitiesRootPath, { withFileTypes: true })
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'ENOENT'
      ) {
        return []
      }

      throw error
    }

    const definitions: SkillDefinition[] = []

    for (const entry of capabilityEntries) {
      if (!entry.isDirectory()) {
        continue
      }

      const skillsRoot = path.join(capabilitiesRootPath, entry.name, 'skills')
      const loaded = await this.loadFromRootDirectory(skillsRoot)
      definitions.push(...loaded)
    }

    return definitions
  }
}
