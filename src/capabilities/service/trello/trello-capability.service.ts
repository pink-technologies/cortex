// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable, InjectionToken } from "@nestjs/common";

import type { ToolContext } from "@/tools/clients/context/tool-context";
import { buildTrelloClient } from "@/tools/clients/trello/provider/trello-client.provider";
import { createCardToolDefinition } from "@/tools/clients/trello/catalog/definition/create-card.definition";
import { ToolRegistryService } from "@/tools/services/registry/tool-registry.service";
import { CapabilityExecutor } from "@/capabilities/executors/capability-executor";
import { ExecutionContext } from "@/shared/types";

/**
 * Trello API credentials wired in {@link CapabilitiesModule} from `TRELLO_API_KEY` and
 * `TRELLO_TOKEN` (see `.env`).
 */
export const TRELLO_CREDENTIALS_TOKEN: InjectionToken<TrelloCredentials> = Symbol('TRELLO_CREDENTIALS');

/**
 * Trello credentials.
 */
export type TrelloCredentials = {
    /**
     * The API key.
     */
    apiKey: string;

    /**
     * The token.
     */
    token: string;
};

/**
 * Trello capability: resolves **which** tool to run via {@link ToolRegistryService}.
 *
 * You do **not** `new ToolRegistryService()` — Nest gives you the app singleton.
 * Call `registry.create(id, toolContext)` **when** you are about to run an action,
 * after building {@link ToolContext} for that user (e.g. `trelloClient` from config
 * or future per-user credential storage).
 */
@Injectable()
export class TrelloCapabilityService implements CapabilityExecutor<
    Record<string, unknown>,
    void
> {
    // MARK: - Properties

    /**
     * The id of the capability.
     */
    readonly id: string = "trello";

    // MARK: - Constructor

    /**
     * Creates a new Trello capability service.
     *
     * @param toolRegistry - The tool registry service.
     * @param credentials - Trello credentials (wired in {@link CapabilitiesModule}).
     */
    constructor(
        private readonly toolRegistry: ToolRegistryService,
        @Inject(TRELLO_CREDENTIALS_TOKEN)
        private readonly credentials: TrelloCredentials,
    ) { }

    // MARK: - CapabilityExecutor

    /**
     * Executes the capability.
     *
     * Expects {@link Record} input: optional `toolId` (default {@link createCardToolDefinition.id}),
     * plus fields required by that tool (e.g. `listId`, `name` for create-card).
     *
     * @param input - The input to the capability.
     * @param _executionContext - The shared execution scope (e.g. `userId` for future credential lookup).
     */
    async execute(
        input: Record<string, unknown>,
        _executionContext: ExecutionContext,
    ): Promise<void> {
        const { toolId: rawToolId, ...payload } = input;
        const toolId = this.resolveToolId(rawToolId);

        const toolContext: ToolContext = {
            trelloClient: buildTrelloClient(this.credentials.apiKey, this.credentials.token),
        };

        const tool = this.toolRegistry.create(toolId, toolContext);

        await tool.execute(payload);
    }

    // MARK: - Private methods

    private resolveToolId(raw: unknown): string {
        if (typeof raw !== "string") {
            return createCardToolDefinition.id;
        }
        const trimmed = raw.trim();
        return trimmed.length > 0 ? trimmed : createCardToolDefinition.id;
    }
}