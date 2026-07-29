// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { type Decoder, DECODER } from '@/shared/types';
import { Inject, Injectable } from '@nestjs/common';
import { readdir, readFile } from 'fs/promises';
import { CapabilityDefinition } from '@/definitions/models/capability-definition/capability-definition';
import { capabilitySchema } from '@/definitions/schema/capability/capability.schema';

/**
 * Loads bundled capability definitions from the local file system.
 *
 * `CapabilityLoader` scans a root directory containing one subdirectory per capability.
 * Each capability subdirectory is expected to include a `capability.toml` manifest.
 * Unlike agents, capabilities loaded here do not require a separate prompt file; all
 * metadata needed for the definition layer is taken from the manifest (validated
 * against {@link capabilitySchema}).
 *
 * Example directory structure:
 *
 * ```text
 * capabilities/
 * ├── financial-data/
 * │   └── capability.toml
 * └── trello/
 *     └── capability.toml
 * ```
 *
 * This class is an infrastructure boundary: it turns on-disk manifests into
 * validated {@link CapabilityDefinition} instances so callers do not depend on
 * TOML syntax, directory layout, or `fs` details.
 */
@Injectable()
export class CapabilitiesLoader {
  // MARK: - Constructor

  /**
   * Creates a capability loader using the configured manifest decoder.
   *
   * @param decoder - Parses raw manifest text and runs structural validation.
   */
  constructor(
    @Inject(DECODER)
    private readonly decoder: Decoder,
  ) {}

  // MARK: - Instance methods

  /**
   * Loads every capability definition found under the given root directory.
   *
   * The path is treated as a container of capability directories. Entries that are
   * not directories are skipped. Each child directory must contain `capability.toml`
   * at its root.
   *
   * For each directory, this method:
   *
   * 1. Reads `capability.toml`.
   * 2. Decodes and validates the payload with {@link capabilitySchema}.
   * 3. Builds a {@link CapabilityDefinition} via {@link CapabilityDefinition.from}.
   *
   * @param rootDirectoryPath - Absolute path to the folder that holds one subdirectory per capability (for example the bundled capabilities root).
   * @returns All successfully loaded definitions, in directory iteration order.
   *
   * @throws {Error} When any capability directory fails to read, decode, validate, or map into a definition. The error message includes the subdirectory name; the thrown error’s `cause` option preserves the underlying failure when available.
   */
  async loadCapabilitiesFromRootDirectory(
    rootDirectoryPath: string,
  ): Promise<CapabilityDefinition[]> {
    const entries = await readdir(rootDirectoryPath, { withFileTypes: true });
    const capabilities: CapabilityDefinition[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      try {
        const agentsDirectoryPath = path.join(rootDirectoryPath, entry.name);
        const manifestPath = path.join(agentsDirectoryPath, 'capability.toml');

        const raw = await readFile(manifestPath, 'utf8');
        const schema = this.decoder.decode(raw, capabilitySchema.parse);
        const capability = CapabilityDefinition.from(schema);

        capabilities.push(capability);
      } catch (error) {
        throw new Error(
          `Failed to load capability from directory: ${entry.name}`,
          { cause: error },
        );
      }
    }

    return capabilities;
  }
}
