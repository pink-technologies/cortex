// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from "@nestjs/common";

import { ToolRegistryService } from "./services/registry/tool-registry.service";
import { ToolBootstrapService } from "./services/tool-bootstrap.service";

/**
 * Tool registry and catalog tools. Trello (and other integrations) use **per-user**
 * clients via {@link ToolContext} at execution time — no global `TrelloClient` provider.
 */
@Module({
    exports: [ToolRegistryService],
    providers: [ToolRegistryService, ToolBootstrapService],
})
export class ToolsModule { }
