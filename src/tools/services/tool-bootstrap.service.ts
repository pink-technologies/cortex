// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable, OnModuleInit } from "@nestjs/common";
import { ToolRegistryService } from "./registry/tool-registry.service";
import { HelloWorldTool } from "../tools";

/**
 * Service responsible for bootstrapping the tool registry.
 */
@Injectable()
export class ToolBootstrapService implements OnModuleInit {
    // MARK: - Constructor

    /**
     * Creates a new {@link ToolBootstrapService}.
     * @param toolRegistryService - The tool registry service.
     * @param helloWorldTool - The hello world tool runtime instance.
     */
    constructor(
        private readonly toolRegistryService: ToolRegistryService,
        private readonly helloWorldTool: HelloWorldTool,
    ) { }

    // MARK: - OnModuleInit

    /**
     * Bootstraps the tool registry.
     */
    onModuleInit(): void {
        this.toolRegistryService.register(this.helloWorldTool);
    }
}