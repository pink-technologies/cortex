// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from "@nestjs/common";
import { ToolRegistryService } from "@/tools/services/registry/tool-registry.service";
import { TrelloClient } from "@/tools/clients/trello/trello-client";
import type { ToolContext } from "@/tools/clients/context/tool-context";

/**
 * Trello capability: resolves **which** tool to run via {@link ToolRegistryService}.
 *
 * You do **not** `new ToolRegistryService()` — Nest gives you the app singleton.
 * Call `registry.create(id, toolContext)` **when** you are about to run an action,
 * after building {@link ToolContext} for that user (e.g. `trelloClient` from their credentials).
 */
@Injectable()
export class TrelloCapabilityService {
    // MARK: - Constructor

    /**
     * Creates a new Trello capability service.
     *
     * @param toolRegistry - The tool registry service.
     */
    constructor(private readonly toolRegistry: ToolRegistryService) {}

    /**
     * Executes a tool.
     *
     * @param toolId - The id of the tool to execute.
     * @param token - The token for the Trello client.
     * @param apiKey - The API key for the Trello client.
     * @param input - The input to the tool.
     */
    async execute(
        toolId: string,
        token: string,
        apiKey: string,
        input: unknown,
    ) {
        const context: ToolContext = {
            trelloClient: new TrelloClient(
                apiKey,
                token,
            ),
        };

        const tool = this.toolRegistry.create(toolId, context);

        return tool.execute(input);
    }
}