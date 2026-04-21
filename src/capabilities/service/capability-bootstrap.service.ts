// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable, OnModuleInit } from "@nestjs/common";

import { TrelloCapabilityExecutor } from "../executors/trello/trello-capability.executor";
import { CapabilityRegistryService } from "./registry/capability-registry.service";

/**
 * Registers all capability instances into {@link CapabilityRegistryService} at module init.
 */
@Injectable()
export class CapabilityBootstrapService implements OnModuleInit {

    // MARK: - Constructor

    /**
     * Creates a new {@link CapabilityBootstrapService}.
     *
     * @param capabilityRegistryService - The capability registry service.
     */
    constructor(
        private readonly capabilityRegistryService: CapabilityRegistryService,
        private readonly trelloCapabilityExecutor: TrelloCapabilityExecutor,
    ) { }

    // MARK: - OnModuleInit

    /**
     * Bootstraps the capability registry.
     */
    async onModuleInit() {
        this.capabilityRegistryService.register(
            this.trelloCapabilityExecutor.id,
            () => this.trelloCapabilityExecutor,
        );
    }
}