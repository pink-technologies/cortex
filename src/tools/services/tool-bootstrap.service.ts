// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable, OnModuleInit } from "@nestjs/common";
import { ToolRegistryService } from "./registry/tool-registry.service";
import { createCreateCardToolFactory } from "../clients/trello/catalog/create-card/create-card.factory";
import { createCardToolDefinition } from "../clients/trello/catalog/definition/create-card.definition";

/**
 * Registers all tool instances into {@link ToolRegistryService} at module init.
 */
@Injectable()
export class ToolBootstrapService implements OnModuleInit {

    // MARK: - Constructor

    /**
     * Creates a new {@link ToolBootstrapService}.
     *
     * @param toolRegistryService - The tool registry service.
     */
    constructor(
        private readonly toolRegistryService: ToolRegistryService,
    ) { }

    // MARK: - OnModuleInit

    /**
     * Bootstraps the tool registry.
     */
    onModuleInit(): void {
        this.toolRegistryService.register(createCardToolDefinition, createCreateCardToolFactory);
    }
}