// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path'
import { access, readdir, readFile } from 'fs/promises'
import type { Decoder } from '@/manifest/decoder/decoder'
import type { SkillDefinition } from '../models/skill-definition'
import { skillSchema } from '../schema/skill-schema'

/**
 * Loads bundled skill definitions from the local file system.
 *
 * Scans a skills catalog root for child directories that contain a
 * `skill.toml` manifest and the referenced prompt file. Shared skills live
 * under `.agents/skills/<skill-id>/`.
 */
export class SkillDefinitionLoader {
  // MARK: - Constructor

  /**
   * Creates a skill loader using the configured manifest decoder.
   *
   * @param decoder - The decoder used to parse and validate skill manifests.
   */
  constructor(private readonly decoder: Decoder) {}

  // MARK: - Instance methods

  /**
   * Loads all skill definitions found under the given root directory.
   *
   * Each immediate child directory that contains `skill.toml` is treated as a
   * skill package. When the root directory does not exist, returns an empty
   * list so Nodes without skill packages can still boot.
   *
   * @param rootDirectoryPath - Path to the directory containing skill packages
   *   (typically `.agents/skills`).
   * @returns The loaded skill definitions.
   */
  async loadFromRootDirectory(rootDirectoryPath: string): Promise<SkillDefinition[]> {
    let entries

    try {
      entries = await readdir(rootDirectoryPath, { withFileTypes: true })
    } catch (error) {
      if (this.isDirectoryMissingError(error)) {
        return []
      }

      throw error
    }

    const definitions: SkillDefinition[] = []

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }

      const skillDirectoryPath = path.join(rootDirectoryPath, entry.name)

      if (!(await this.hasSkillManifest(skillDirectoryPath))) {
        continue
      }

      try {
        const manifestPath = path.join(skillDirectoryPath, 'skill.toml')
        const raw = await readFile(manifestPath, 'utf8')
        const schema = this.decoder.decode(raw, skillSchema.parse)
        const promptPath = path.join(skillDirectoryPath, schema.prompt_file)
        const prompt = (await readFile(promptPath, 'utf8')).trim()

        if (prompt.length === 0) {
          throw new Error(`Skill prompt file '${schema.prompt_file}' is empty.`)
        }

        const definition = {
          description: schema.description,
          id: schema.id,
          prompt,
          ...(schema.keywords.length > 0 ? { keywords: schema.keywords } : {})
        }

        definitions.push(definition)
      } catch (error) {
        throw new Error(`Failed to load skill from directory: ${entry.name}`, {
          cause: error,
        })
      }
    }

    return definitions
  }

  // MARK: - Private methods

  private async hasSkillManifest(directoryPath: string): Promise<boolean> {
    try {
      await access(path.join(directoryPath, 'skill.toml'))
      return true
    } catch (error) {
      if (this.isDirectoryMissingError(error)) {
        return false
      }

      throw error
    }
  }  

  private isDirectoryMissingError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    )
  }
}
