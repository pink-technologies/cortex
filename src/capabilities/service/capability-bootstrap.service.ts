// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable, OnModuleInit } from "@nestjs/common";
import { CapabilityRegistryService } from "./registry/ capability-registry.service";
import { TrelloCapabilityService } from "./trello/ trello-capability.service";

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
        private readonly trelloCapabilityService: TrelloCapabilityService,
    ) { }

    // MARK: - OnModuleInit

    /**
     * Bootstraps the capability registry.
     */
    async onModuleInit() {
        this.capabilityRegistryService.register(
            this.trelloCapabilityService.id,
            () => this.trelloCapabilityService,
        );
    }
}