import { Injectable, OnModuleInit } from "@nestjs/common";
import { ToolRegistryService } from "./registry/tool-registry.service";
import { HelloWorldTool } from "../implementations";
import { UUIDGeneratorTool } from "../implementations/uuid-generator/uuid-generator.tool";

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
        private readonly uuidGeneratorTool: UUIDGeneratorTool,
    ) { }

    // MARK: - OnModuleInit

    /**
     * Bootstraps the tool registry.
     */
    onModuleInit(): void {
        this.toolRegistryService.register(this.helloWorldTool);
        this.toolRegistryService.register(this.uuidGeneratorTool);
    }
}