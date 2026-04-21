// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from "@nestjs/common";

import { CapabilityFactory } from "@/capabilities/capability";
import { CapabilityExecutor } from "@/capabilities/executors/capability-executor";
import { CapabilityNotFoundError } from "../error/error";

/**
 * Registry of capabilities.
 */
@Injectable()
export class CapabilityRegistryService {
    // MARK: - Private properties

    private readonly capabilities = new Map<string, CapabilityFactory>();

    // MARK: - CapabilityRegistryService

    /**
     * Registers a capability factory by id.
     *
     * @param id - The id of the capability.
     * @param factory - The factory for the capability.
     */
    register(id: string, factory: CapabilityFactory): void {
        this.capabilities.set(id, factory);
    }

    /**
     * Gets a capability executor by id.
     *
     * @param id - The id of the capability.
     * @returns The capability executor.
     * @throws {@link Error} If the capability is not found.
     */
    get(id: string): CapabilityExecutor {
        const factory = this.capabilities.get(id);

        if (!factory) throw new CapabilityNotFoundError();

        return factory();
    }
}