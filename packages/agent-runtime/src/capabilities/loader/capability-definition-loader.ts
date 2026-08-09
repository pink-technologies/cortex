// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path'
import { readdir, readFile } from 'fs/promises'
import type { Decoder } from '@/manifest/decoder/decoder'
import type { CapabilityDefinition } from '../models/capability-definition'
import { capabilitySchema } from '../schema/capability-schema'

/**
 * Loads bundled capability definitions from the local file system.
 *
 * Scans a root directory containing one subdirectory per capability. Each
 * subdirectory must include a `capability.toml` manifest. The loader converts
 * file-based manifests into {@link CapabilityDefinition} records so the rest
 * of the runtime does not depend on TOML parsing or directory traversal.
 *
 * Example directory structure:
 *
 * ```text
 * .agents/capabilities/
 * └── repository.review/
 *     └── capability.toml
 * ```
 */
export class CapabilityDefinitionLoader {
  // MARK: - Constructor

  /**
   * Creates a capability definition loader.
   *
   * @param decoder - Decoder used to parse and validate capability manifests.
   */
  constructor(private readonly decoder: Decoder) {}

  // MARK: - Instance methods

  /**
   * Loads all capability definitions found under the given root directory.
   *
   * Files directly inside the root are ignored. Each child directory is treated
   * as one capability and must contain a `capability.toml` manifest.
   *
   * @param rootDirectoryPath - Path to the directory containing capability packages.
   * @returns The loaded capability definitions.
   * @throws When a capability directory cannot be loaded or decoded.
   */
  async loadFromRootDirectory(rootDirectoryPath: string): Promise<CapabilityDefinition[]> {
    const entries = await readdir(rootDirectoryPath, { withFileTypes: true })
    const definitions: CapabilityDefinition[] = []

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }

      try {
        const capabilityDirectoryPath = path.join(rootDirectoryPath, entry.name)
        const manifestPath = path.join(capabilityDirectoryPath, 'capability.toml')
        const raw = await readFile(manifestPath, 'utf8')
        const schema = this.decoder.decode(raw, capabilitySchema.parse)

        definitions.push({
          ...(schema.default_agent ? { defaultAgentId: schema.default_agent } : {}),
          description: schema.description,
          id: schema.id,
          toolNames: schema.tools,
        })
      } catch (error) {
        throw new Error(`Failed to load capability from directory: ${entry.name}`, {
          cause: error,
        })
      }
    }

    return definitions
  }
}
