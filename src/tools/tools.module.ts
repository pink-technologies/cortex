// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { DatabaseModule } from "src/infraestructure/database";
import { Module } from "@nestjs/common";
import { ToolRegistryService } from "./services/registry/tool-registry.service";
import { ToolExecutorController } from "./controller/tool-executor.controller";
import { ToolExecutorService } from "./services/executor/tool-executor.service";
import { ToolRepository } from "./repositories/tool.repository";
import { ToolBootstrapService } from "./services/tool-bootstrap.service";
import {
    HelloWorldTool,
    UUIDGeneratorTool,
} from "./implementations";

@Module({
    controllers: [ToolExecutorController],
    imports: [DatabaseModule],
    exports: [
        ToolRegistryService,
        ToolExecutorService,
        ToolRepository,
    ],
    providers: [
        HelloWorldTool,
        UUIDGeneratorTool,
        ToolBootstrapService,
        ToolRegistryService,
        ToolExecutorService,
        ToolRepository,
    ],
})


export class ToolsModule { }