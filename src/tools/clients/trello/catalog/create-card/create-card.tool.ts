// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { TrelloClient } from "@/tools/clients/trello-client";
import { Tool } from "@/tools/tool";
import { TrelloCardCreationError } from "../error/trello.error";

/**
 * Input for the create card tool.
 */
interface CreateCardToolInput {
    /**
     * The ID of the list to create the card in.
     */
    listId: string;
    /**
     * The name of the card.
     */
    name: string;
    /**
     * The description of the card.
     */
    description: string;
}

/**
 * Output for the create card tool.
 */
interface CreateCardToolOutput {
    /**
     * The ID of the created card.
     */
    id: string;
}

/**
 * Create card tool.
 */
export class CreateCardTool implements Tool<CreateCardToolInput, CreateCardToolOutput> {
    // MARK: - Properties

    /**
     * The ID of the tool.
     */
    readonly id = 'trello-create-card';

    /**
     * The name of the tool.
     */
    readonly name = 'Trello Create Card';

    /**
     * The description of the tool.
     */
    readonly description = 'Create a new card in Trello';

    // MARK: - Constructor

    /**
     * Creates a new create card tool.
     *
     * @param trelloClient - The Trello client.
     */
    constructor(private readonly trelloClient: TrelloClient) { }

    /**
     * Executes the tool with the given input.
     *
     * @param input - The input to the tool.
     * @returns The output of the tool.
     */
    async execute(input: CreateCardToolInput): Promise<CreateCardToolOutput> {
        const url = this.trelloClient.buildUrl('/cards', {
            idList: input.listId,
            name: input.name,
            desc: input.description,
        })

        const response = await fetch(url, { method: 'POST' })

        if (!response.ok) {
            throw new TrelloCardCreationError();
        }

        const data = await response.json();

        return { id: data.id };
    }
}
