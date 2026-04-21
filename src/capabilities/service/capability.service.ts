// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from "path";
import { readFile, readdir } from "fs/promises";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { DECODER, type Decoder } from "@/shared/types";
import { capabilitySchema } from "../schema/capability.schema";
import { STORAGE, type Storage } from "@/infraestructure/storage";
import { BUNDLED_CAPABILITIES_PATH } from "../capability-tokens";
import { Capability } from "../capability";
import { CapabilitiesInitializationError } from "./error/error";

/**
 * Loads capabilities from TOML files under the directory injected as {@link BUNDLED_CAPABILITIES_ROOT}
 * (wired in `CapabilitiesModule` from `CAPABILITIES_BUNDLED_ROOT` in env — same pattern as `REDIS_URL` in `StorageModule`).
 */
@Injectable()
export class CapabilityService implements OnModuleInit {
    // MARK: - Constructor

    /**
     * Wires bundled capability root, TOML decoding, and persistence used when {@link load} registers each {@link Capability}.
     *
     * Token bindings are defined in {@link CapabilitiesModule} (`STORAGE`, {@link DECODER}, {@link BUNDLED_CAPABILITIES_ROOT}).
     *
     * @param bundledCapabilitiesPath - Injected via {@link BUNDLED_CAPABILITIES_PATH}; absolute directory scanned for subfolders containing `capability.toml`.
     * @param decoder - Injected via {@link DECODER} as {@link Decoder}; parses capability `.toml` (syntax) and optional refine step (e.g. Zod).
     * @param storage - Injected via {@link STORAGE}; stores and loads {@link Capability} instances by id after {@link load}.
     */
    constructor(
        @Inject(BUNDLED_CAPABILITIES_PATH)
        private readonly bundledCapabilitiesPath: string,
        @Inject(DECODER)
        private readonly decoder: Decoder,
        @Inject(STORAGE)
        private readonly storage: Storage,
    ) {}

    // MARK: - OnModuleInit

    /**
     * Loads the capability from the TOML file when the module boots.
     */
    async onModuleInit(): Promise<void> {
        await this.loadAndRegisterCapabilities();
    }

    // MARK: - Private methods

    private async loadAndRegisterCapabilities(): Promise<void> {
        const entries = await readdir(this.bundledCapabilitiesPath, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue;
            }

            const filePath = path.join(this.bundledCapabilitiesPath, entry.name, "capability.toml");

            try {
                const raw = await readFile(filePath, "utf8");
                const schema = this.decoder.decode(raw, (v) => capabilitySchema.parse(v));        
                const capability = {
                    id: schema.id
                };

                if (await this.storage.read<Capability>(capability.id)) {
                    throw new Error('Capability already registered');
                }

                await this.storage.write(capability, capability.id);
            } catch (error) {
                throw new CapabilitiesInitializationError('Failed to load capability from file', error);
            }
        }
    }
}
