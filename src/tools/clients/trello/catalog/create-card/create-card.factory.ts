// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ToolFactory } from "@/tools/tool";
import { CreateCardTool } from "./create-card.tool";
import { TrelloClientMissingInContextError } from "../error/trello.error";

/**
 * Creates a new create card tool factory.
 *
 * @param context - The context.
 * @returns The create card tool factory.
 */
export const createCreateCardToolFactory: ToolFactory = (context) => {
    if (!context.trelloClient) {
        throw new TrelloClientMissingInContextError();
    }

    return new CreateCardTool(context.trelloClient);
}