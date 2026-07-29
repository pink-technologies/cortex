// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { BUNDLED_CAPABILITIES_PATH } from '@/definitions/tokens';
import { Inject, Injectable } from '@nestjs/common';
import { STORAGE, type Storage } from '@/infraestructure/storage';
import { CapabilityDefinition } from '@/definitions/models/capability-definition/capability-definition';
import { CapabilitiesLoader } from './loader/capabilities-loader';
import { DefinitionModuleError } from '@/definitions/error/definition-module-error';
import {
  CapabilityAlreadyRegisteredError,
  CapabilityLoadError,
  CapabilityNotFoundError,
  CapabilityServiceError,
} from './error/error';

/**
 * Registers bundled capability definitions into configured storage so the rest of
 * the system can resolve them by stable capability id.
 *
 * `CapabilityService` does not parse manifests itself: it delegates bulk loading to
 * {@link CapabilitiesLoader}, which walks the bundled capabilities root and returns
 * validated `CapabilityDefinition` instances. This service then ensures each id is
 * registered at most once and writes each definition through {@link Storage}.
 *
 * Typical startup wiring invokes this from a definitions bootstrapper (rather than
 * `OnModuleInit`) so load order stays explicit across connection types, integrations,
 * capabilities, skills, and agents.
 *
 * Persisted definitions inform agents and skills about which integrations or system
 * operations exist for routing and tooling.
 */
@Injectable()
export class CapabilityDefinitionService {
  // MARK: - Constructor

  /**
   * Wires the filesystem loader, bundled capabilities root token, and storage backend
   * used by {@link CapabilityDefinitionService.registerBundledCapabilities}.
   *
   * @param capabilitiesLoader - Loads `CapabilityDefinition` records from disk (decode + validate manifests).
   * @param bundledCapabilitiesPath - Absolute directory injected as {@link BUNDLED_CAPABILITIES_PATH}; passed to the loader as the scan root.
   * @param storage - Key-value persistence for definitions; `read` checks id collisions, `write` persists each capability by id.
   */
  constructor(
    @Inject(CapabilitiesLoader)
    private readonly capabilitiesLoader: CapabilitiesLoader,
    @Inject(BUNDLED_CAPABILITIES_PATH)
    private readonly bundledCapabilitiesPath: string,
    @Inject(STORAGE)
    private readonly storage: Storage,
  ) {}

  // MARK: - Instance methods

  /**
   * Resolves a persisted capability definition by stable id.
   *
   * Reads {@link Storage} for the key `id`. When a definition exists, returns it;
   * when storage reports no record, throws {@link CapabilityNotFoundError}.
   *
   * @param id - Capability id as declared in `capability.toml` and used at registration time.
   * @returns The stored {@link CapabilityDefinition} for `id`.
   *
   * @throws {@link CapabilityNotFoundError} When no definition is registered for `id`.
   * @throws {@link CapabilityServiceError} When `storage.read` fails (for example I/O or driver errors); the message includes `id` and `cause` chains the underlying error when provided.
   */
  async find(id: string): Promise<CapabilityDefinition> {
    let capability: CapabilityDefinition | null = null;

    try {
      capability = await this.storage.read<CapabilityDefinition>(id);
    } catch (error) {
      throw new CapabilityServiceError(`Failed to retrieve capability ${id}`, {
        cause: error,
      });
    }

    if (!capability) {
      throw new CapabilityNotFoundError(id);
    }

    return capability;
  }

  /**
   * Loads every bundled capability definition from disk and persists each one.
   *
   * Delegates directory traversal and manifest handling to
   * {@link CapabilitiesLoader.loadCapabilitiesFromRootDirectory} using the path
   * supplied through {@link BUNDLED_CAPABILITIES_PATH}. For each returned `CapabilityDefinition`, reads
   * storage for an existing record with the same id; if absent, writes the definition.
   *
   * Intended invariant: at most one stored definition per capability id for the
   * bundled catalog.
   *
   * @throws If the loader fails while scanning or parsing manifests, that failure
   * propagates (see {@link CapabilitiesLoader.loadCapabilitiesFromRootDirectory}).
   * @throws {@link CapabilityLoadError} When duplicate detection or `storage.write`
   * throws, or when {@link CapabilityAlreadyRegisteredError} is raised—those cases
   * are caught by the per-capability `try` and surfaced as `CapabilityLoadError`
   * without preserving the original error type.
   */
  async registerBundledCapabilities(): Promise<void> {
    const capabilities =
      await this.capabilitiesLoader.loadCapabilitiesFromRootDirectory(
        this.bundledCapabilitiesPath,
      );

    for (const capability of capabilities) {
      try {
        if (await this.storage.read<CapabilityDefinition>(capability.id)) {
          throw new CapabilityAlreadyRegisteredError(capability.id);
        }

        await this.storage.write(capability, capability.id);
      } catch (error) {
        if (error instanceof DefinitionModuleError) throw error;

        throw new CapabilityLoadError(
          `Failed to register capability: ${capability.id}`,
          { cause: error },
        );
      }
    }
  }
}
