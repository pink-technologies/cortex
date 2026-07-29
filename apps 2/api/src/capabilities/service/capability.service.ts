// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { readFile, readdir } from 'fs/promises';
import path from 'path';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DECODER, type Decoder } from '@/shared/types';
import { capabilitySchema } from '@/definitions/schema/capability/capability.schema';
import { STORAGE, type Storage } from '@/infraestructure/storage';
import { Capability } from '../capability';
import { BUNDLED_CAPABILITIES_ROOT } from '../capability-tokens';
import {
  CapabilityAlreadyRegisteredError,
  CapabilityFileLoadError,
} from './error/error';

/**
 * Service responsible for registering bundled capability definitions into the
 * runtime capability registry.
 *
 * `CapabilityService` scans the configured bundled capabilities directory,
 * reads each `capability.toml` manifest, decodes and validates the manifest
 * payload, and stores the resulting {@link Capability} definition by its stable
 * capability id.
 *
 * The service is intentionally invoked by the application definition
 * bootstrapper instead of registering itself through a Nest lifecycle hook. This
 * allows Cortex to control the startup order of bundled definitions, such as
 * connection types, integrations, capabilities, skills, and agents.
 *
 * Registered capabilities are later used by agents and skills to determine
 * which external actions, integrations, or system operations are available
 * during execution.
 */
@Injectable()
export class CapabilityService {
  // MARK: - Constructor

  /**
   * Wires bundled capability root, TOML decoding, and persistence used when {@link load} registers each {@link Capability}.
   *
   * Token bindings are defined in {@link CapabilitiesModule} (`STORAGE`, {@link DECODER}, {@link BUNDLED_CAPABILITIES_ROOT}).
   *
   * @param capabilitiesTomlPath - Injected via {@link BUNDLED_CAPABILITIES_ROOT}; absolute directory scanned for subfolders containing `capability.toml`.
   * @param decoder - Injected via {@link DECODER} as {@link Decoder}; parses capability `.toml` (syntax) and optional refine step (e.g. Zod).
   * @param storage - Injected via {@link STORAGE}; stores and loads {@link Capability} instances by id after {@link load}.
   */
  constructor(
    @Inject(BUNDLED_CAPABILITIES_ROOT)
    private readonly capabilitiesTomlPath: string,
    @Inject(DECODER)
    private readonly decoder: Decoder,
    @Inject(STORAGE)
    private readonly storage: Storage,
  ) {}

  // MARK: - Instance methods

  /**
   * Loads and registers all bundled capability definitions.
   *
   * This method scans the bundled capabilities root for child directories,
   * expects each capability directory to contain a `capability.toml` manifest,
   * decodes and validates the manifest, creates a {@link Capability} definition,
   * and stores it by its stable capability id.
   *
   * Registration enforces the invariant that a capability id can only be
   * registered once.
   *
   * @throws CapabilityAlreadyRegisteredError If a capability with the same id is
   * already registered.
   * @throws CapabilityFileLoadError If a capability manifest cannot be read,
   * decoded, validated, or persisted.
   */
  async registerBundledCapabilities(): Promise<void> {
    const entries = await readdir(this.capabilitiesTomlPath, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const filePath = path.join(
        this.capabilitiesTomlPath,
        entry.name,
        'capability.toml',
      );

      try {
        const raw = await readFile(filePath, 'utf8');
        const schema = this.decoder.decode(raw, capabilitySchema.parse);
        const capability = {
          id: schema.id,
        };

        if (await this.storage.read<Capability>(capability.id)) {
          throw new CapabilityAlreadyRegisteredError();
        }

        await this.storage.write(capability, capability.id);
      } catch {
        throw new CapabilityFileLoadError();
      }
    }
  }
}
