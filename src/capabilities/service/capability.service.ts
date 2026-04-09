// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { readFile, readdir } from "fs/promises";
import path from "path";

import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { TomlParser } from "@/shared/types";

import { CapabilitySchema, capabilitySchema } from "../schema/capability.schema";
import type { Storage } from "@/infraestructure/storage/storage";
import { STORAGE } from "@/infraestructure/storage/storage.tokens";
import { Capability } from "../capability";
import { CAPABILITIES_BUNDLED_ROOT } from "../capability.tokens";

import { CapabilityFileLoadError } from "./error/error";

/**
 * Loads capabilities from TOML files under the directory injected as {@link CAPABILITIES_BUNDLED_ROOT}
 * (wired in `CapabilitiesModule` from `CAPABILITIES_BUNDLED_ROOT` in env — same pattern as `REDIS_URL` in `StorageModule`).
 */
@Injectable()
export class CapabilityService implements OnModuleInit {
    // MARK: - Constructor

    /**
     * @param storage - Storage service for capabilities.
     * @param tomlParser - Toml parser for capabilities.
     * @param capabilitiesTomlPath - Absolute path to the directory that contains the capabilities.
     */
    constructor(
        @Inject(STORAGE)
        private readonly storage: Storage,
        private readonly tomlParser: TomlParser,
        @Inject(CAPABILITIES_BUNDLED_ROOT)
        private readonly capabilitiesTomlPath: string,
    ) { }

    // MARK: - OnModuleInit

    /**
     * Loads the capability from the TOML file when the module boots.
     */
    async onModuleInit(): Promise<void> {
        await this.load();
    }

    // MARK: - Instance methods

    /**
     * Loads the capabilities from the TOML files under the directory 
     * injected as {@link CAPABILITIES_BUNDLED_ROOT}.
     */
    async load(): Promise<void> {
        const entries = await readdir(this.capabilitiesTomlPath, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue;
            }

            const filePath = path.join(this.capabilitiesTomlPath, entry.name, "capability.toml");
            try {
                await this.loadCapabilityFromFile(filePath);
            } catch {
                throw new CapabilityFileLoadError();
            }
        }
    }

    // MARK: - Private methods

    private async loadCapabilityFromFile(filePath: string): Promise<Capability> {
        const raw = await readFile(filePath, "utf8");
        const parsed = this.tomlParser.parser<unknown>(raw);
        const dto = capabilitySchema.parse(parsed);
        const schema = CapabilitySchema.from(dto);
        const capability = this.schemaToCapability(schema);

        await this.storage.write(capability.id, capability);

        return capability;
    }

    private schemaToCapability(capability: CapabilitySchema): Capability {
        const schema = capability.schema;

        return {
            id: schema.id
        };
    }
}
