// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Tool } from "@/tools/tool";
import { TrelloCardCreationError } from "../error/trello.error";
import { TrelloClient } from "../../trello-client";

/**
 * Input required to create a Trello card.
 */
interface CreateCardToolInput {
    /**
     * The ID of the list where the card will be created.
     */
    listId: string;

    /**
     * The title of the card.
     */
    name: string;

    /**
     * The description of the card.
     */
    description: string;
}

/**
 * Output returned after creating a Trello card.
 */
interface CreateCardToolOutput {
    /**
     * The unique identifier of the created card.
     */
    id: string;
}

/**
 * Tool responsible for creating a card in Trello.
 *
 * ## Lifecycle
 * This class is NOT managed by NestJS directly. Instead, it is:
 *
 * 1. Instantiated via a {@link ToolFactory}
 * 2. Provided with a user-scoped {@link TrelloClient}
 * 3. Executed once per request
 *
 * ## Responsibilities
 *
 * - Transform input into a Trello API request
 * - Call the Trello API through the provided client
 * - Handle API errors and map them to domain errors
 *
 * ## Design notes
 *
 * - Stateless: does not store any execution data
 * - Context-aware via constructor injection (client is preconfigured)
 * - Focused only on business logic (no auth, no orchestration)
 */
export class CreateCardTool implements Tool<CreateCardToolInput, CreateCardToolOutput> {
    // MARK: - Constructor

    /**
     * Creates a new {@link CreateCardTool} instance.
     *
     * @param trelloClient - Preconfigured Trello client for the current user.
     */
    constructor(private readonly trelloClient: TrelloClient) { }

    // MARK: - Instance methods

    /**
     * Executes the tool.
     *
     * Sends a request to Trello to create a new card in the specified list.
     *
     * @param input - Data required to create the card.
     * @returns The ID of the newly created card.
     *
     * @throws {@link TrelloCardCreationError} When the API request fails.
     */
    async execute(input: CreateCardToolInput): Promise<CreateCardToolOutput> {
        const url = this.trelloClient.buildUrl('/cards', {
            idList: input.listId,
            name: input.name,
            desc: input.description,
        });

        const response = await fetch(url, { method: 'POST' });

        if (!response.ok) {
            throw new TrelloCardCreationError();
        }

        const data = await response.json();

        return { id: data.id };
    }
}
